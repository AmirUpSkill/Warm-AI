"""
Agent Service - Core agent execution using Pydantic AI framework.

Handles:
- Building agents from configuration
- Composing system prompts with instructions, guardrails, and tone
- Streaming chat responses with RAG context (Gemini File Search)
- Ephemeral test mode (no history saved)
"""

import json
from typing import AsyncGenerator, List, Optional
from datetime import datetime

from pydantic_ai import Agent
from google import genai
from google.genai import types
from sqlmodel import Session as DBSession, select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import app_logger
from app.db.agent_models import Agent as AgentModel, AgentContext
from app.schemas.chat import ChatStreamResponse
from app.schemas.file_search import FileSearchCitation


settings = get_settings()


# --- Tone Presets ---
TONE_PRESETS = {
    "professional": "Respond in a professional, business-like manner. Be clear and formal.",
    "friendly": "Be warm, approachable, and conversational. Use a friendly tone.",
    "technical": "Be precise, detailed, and use technical terminology appropriately.",
    "concise": "Keep responses brief and to the point. Avoid unnecessary words.",
    "creative": "Be imaginative, engaging, and use creative language.",
    "empathetic": "Be understanding, supportive, and show compassion.",
    "formal": "Use traditional, respectful language. Maintain formality.",
    "casual": "Be relaxed and conversational, like talking to a friend.",
    "educational": "Be informative and teaching-focused. Explain concepts clearly.",
}


class AgentService:
    """
    Service for managing and executing custom AI agents.
    Integrates Pydantic AI for agent execution and Gemini for LLM.
    """

    def __init__(self, db: DBSession):
        self.db = db
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.default_model = "gemini-2.5-flash"

    def _build_system_prompt(self, agent: AgentModel) -> str:
        """
        Compose full system prompt from agent configuration.
        Combines: base instructions + guardrails + tone modulation
        """
        parts = []
        
        # --- Base identity ---
        parts.append(f"You are {agent.name}.")
        
        # --- Description context ---
        if agent.description:
            parts.append(f"Description: {agent.description}")
        
        # --- Core instructions ---
        if agent.instructions:
            parts.append(f"\n## Instructions\n{agent.instructions}")
        
        # --- Tone modulation ---
        tone_text = ""
        if agent.custom_tone:
            tone_text = agent.custom_tone
        elif agent.tone in TONE_PRESETS:
            tone_text = TONE_PRESETS[agent.tone]
        
        if tone_text:
            parts.append(f"\n## Tone\n{tone_text}")
        
        # --- Guardrails ---
        if agent.guardrails:
            try:
                guardrail_list = json.loads(agent.guardrails)
                if guardrail_list:
                    guardrails_text = "\n".join([f"- {g}" for g in guardrail_list])
                    parts.append(f"\n## Guardrails (You MUST follow these rules)\n{guardrails_text}")
            except json.JSONDecodeError:
                pass
        
        return "\n".join(parts)

    async def get_agent(self, agent_id: int) -> Optional[AgentModel]:
        """
            Get agent by ID with eager-loaded contexts.
        """
        statement = select(AgentModel).options(selectinload(AgentModel.contexts)).where(AgentModel.id == agent_id)
        result = await self.db.execute(statement)
        return result.scalar_one_or_none()

    async def list_agents(self, mine: bool = False, browse: bool = False) -> List[AgentModel]:
        """
        List agents based on filter.
        - mine=True: user's agents (for now, all non-default agents)
        - browse=True: public/default agents
        """
        statement = select(AgentModel).options(selectinload(AgentModel.contexts))
        
        if browse:
            statement = statement.where(
                (AgentModel.is_public == True) | (AgentModel.is_default == True)
            )
        elif mine:
            statement = statement.where(AgentModel.is_default == False)
        
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def create_agent(
        self,
        name: str,
        instructions: str,
        description: Optional[str] = None,
        guardrails: Optional[str] = None,
        tone: str = "professional",
        custom_tone: Optional[str] = None,
        is_public: bool = False,
    ) -> AgentModel:
        """
            Create a new agent.
        """
        agent = AgentModel(
            name=name,
            description=description,
            instructions=instructions,
            guardrails=guardrails,
            tone=tone,
            custom_tone=custom_tone,
            is_public=is_public,
            is_default=False,
        )
        self.db.add(agent)
        await self.db.commit()
        
        # Re-fetch with eager loading to avoid lazy load issues
        created_agent = await self.get_agent(agent.id)
        app_logger.info(f"Created agent: {created_agent.name} (id={created_agent.id})")
        return created_agent

    async def update_agent(self, agent_id: int, **updates) -> Optional[AgentModel]:
        """
            Update agent fields.
        """
        agent = await self.get_agent(agent_id)
        if not agent:
            return None
        
        for key, value in updates.items():
            if value is not None and hasattr(agent, key):
                setattr(agent, key, value)
        
        agent.updated_at = datetime.utcnow()
        self.db.add(agent)
        await self.db.commit()
        updated_agent = await self.get_agent(agent_id)
        app_logger.info(f"Updated agent: {updated_agent.name} (id={updated_agent.id})")
        return updated_agent

    async def delete_agent(self, agent_id: int) -> bool:
        """
            Delete an agent and its contexts.
        """
        agent = await self.get_agent(agent_id)
        if not agent:
            return False
        
        # --- Delete associated file search stores ---
        for ctx in agent.contexts:
            self._delete_file_search_store(ctx.file_search_store_name)
        
        await self.db.delete(agent)
        await self.db.commit()
        app_logger.info(f"Deleted agent: {agent.name} (id={agent_id})")
        return True

    def _delete_file_search_store(self, store_name: str):
        """
            Delete a Gemini File Search store.
        """
        try:
            self.client.file_search_stores.delete(name=store_name, config={"force": True})
            app_logger.info(f"Deleted file search store: {store_name}")
        except Exception as e:
            app_logger.error(f"Failed to delete store {store_name}: {e}")

    async def chat_stream(
        self,
        agent: AgentModel,
        message: str,
        model: str = "gemini-2.5-flash",
    ) -> AsyncGenerator[ChatStreamResponse, None]:
        """
        Stream chat response using agent configuration.
        Supports RAG via Gemini File Search if agent has context files.
        """
        app_logger.info(f"Agent Chat | Agent: {agent.name} | Model: {model}")
        
        system_prompt = self._build_system_prompt(agent)
        
        try:
            # ---  Build tools list ---
            tools = []
            
            # --- Add File Search tool if agent has context files ---
            store_names = [ctx.file_search_store_name for ctx in agent.contexts]
            if store_names:
                tools.append(
                    types.Tool(
                        file_search=types.FileSearch(file_search_store_names=store_names)
                    )
                )
            
            # --- Configure generation ---
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                tools=tools if tools else None,
            )
            
            # --- Stream response ---
            response_stream = await self.client.aio.models.generate_content_stream(
                model=model,
                contents=message,
                config=config,
            )
            
            last_chunk = None
            async for chunk in response_stream:
                last_chunk = chunk
                if chunk.text:
                    yield ChatStreamResponse(type="token", content=chunk.text)
            
            # --- Extract file citations if any ---
            if last_chunk and last_chunk.candidates:
                citations = self._extract_file_citations(last_chunk.candidates[0])
                if citations:
                    citations_dict = [
                        {
                            "source_title": c.source_title,
                            "text_segment": c.text_segment,
                            "start_index": c.start_index,
                            "end_index": c.end_index,
                        }
                        for c in citations
                    ]
                    yield ChatStreamResponse(
                        type="file_citation",
                        content=json.dumps(citations_dict),
                    )
            
            yield ChatStreamResponse(type="done")
            
        except Exception as e:
            app_logger.error(f"Agent chat error: {e}")
            yield ChatStreamResponse(
                type="error",
                content=f"Error chatting with agent: {str(e)}",
            )

    def _extract_file_citations(self, candidate) -> List[FileSearchCitation]:
        """
            Extract file citations from grounding metadata.
        """
        citations = []
        
        try:
            if not hasattr(candidate, 'grounding_metadata'):
                return citations
            
            gm = candidate.grounding_metadata
            if not gm:
                return citations
            
            chunks = getattr(gm, 'grounding_chunks', [])
            supports = getattr(gm, 'grounding_supports', [])
            
            for support in supports:
                segment = getattr(support, 'segment', None)
                if not segment:
                    continue
                
                segment_text = getattr(segment, 'text', '').strip()
                start_idx = getattr(segment, 'start_index', None)
                end_idx = getattr(segment, 'end_index', None)
                
                indices = getattr(support, 'grounding_chunk_indices', [])
                source_title = "Document"
                
                for idx in indices:
                    if idx < len(chunks):
                        chunk = chunks[idx]
                        ctx = getattr(chunk, 'retrieved_context', None)
                        if ctx:
                            source_title = getattr(ctx, 'title', 'Document')
                            break
                
                citations.append(FileSearchCitation(
                    source_title=source_title,
                    text_segment=segment_text,
                    start_index=start_idx,
                    end_index=end_idx,
                ))
        
        except Exception as e:
            app_logger.error(f"Error extracting citations: {e}")
        
        return citations


def get_tone_presets() -> List[dict]:
    """
        Get list of available tone presets.
    """
    return [
        {"id": key, "name": key.title(), "description": desc}
        for key, desc in TONE_PRESETS.items()
    ]
