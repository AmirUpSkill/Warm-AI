from typing import AsyncGenerator , List , Optional , Any 
from google import genai 
from google.genai import types 
from app.core.config import get_settings 
from app.core.logging import app_logger 
from app.schemas.common import ChatMode 
from app.schemas.chat import ChatStreamResponse , SourceCitation    


settings = get_settings()

class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_flash = "gemini-flash-latest"
        self.system_instruction = """
            You are Warm AI , a professional intelligence assistant . 
            Your goal is to provide accurate , career-focused , and data-driven insights 
            Be concise , professional , and helpful 
        """
    def _extract_citations(self, candidate: Any ) -> List[SourceCitation]:
        """
            Parses the complex Gemini GroundingMetadata object to extract URLs and Titles . 
        """
        sources = []
        if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
            metadata = candidate.grounding_metadata
            if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                for chunk in metadata.grounding_chunks:
                    if hasattr(chunk, 'web') and chunk.web:
                        sources.append(SourceCitation(
                            title=chunk.web.title or "Source",
                            url=chunk.web.uri or ""
                        ))
        return sources
    async def chat_stream(
        self,
        message: str ,
        mode: ChatMode = ChatMode.STANDARD,
        model: str = "gemini-flash-latest" 
    ) -> AsyncGenerator[ChatStreamResponse, None]:
        """
            Streams response from Gemini , handling both Standard and Web Search modes . 
        """
        app_logger.info(f"Starting Chat Stream | Mode: {mode} | Model: {model}")
        # --- Configure Tools (Grounding) --- 
        tools = []
        if mode == ChatMode.WEB_SEARCH:
            tools = [types.Tool(google_search=types.GoogleSearch())]
        config = types.GenerateContentConfig(
            system_instruction = self.system_instruction,
            temperature = 0.7 if mode == ChatMode.STANDARD else 0.3,
            tools = tools
        )
        # --- Let's Call Gemini --- 
        try:
            # --- We Use Client.aio for better non-blocking streaming experience --- 
            response_stream = await self.client.aio.models.generate_content_stream(
                model=model, 
                contents=message,
                config=config
            )
            # --- Stream the response with async iteration --- 
            last_chunk = None
            async for chunk in response_stream:
                last_chunk = chunk
                if chunk.text:
                    yield ChatStreamResponse(
                        type="token",
                        content=chunk.text
                    )
            # --- Finally let's handle Grounding/Citations ---
            if last_chunk is not None and last_chunk.candidates:
                citations = self._extract_citations(last_chunk.candidates[0])
                if citations:
                    yield ChatStreamResponse(
                        type="citation",
                        sources=citations
                    )
            # --- Signal Completion --- 
            yield ChatStreamResponse(type="done")
        except Exception as e:
            app_logger.error(f"Gemini API Error: {str(e)}")
            yield ChatStreamResponse(
                type="error",
                content="I encountered an error connecting to the AI service."
            )