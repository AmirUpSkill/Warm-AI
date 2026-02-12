"""
Agent API Endpoints - CRUD, avatar/context uploads, chat streaming.
"""

import os
import json
import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session as DBSession
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_db
from app.services.agent_service import AgentService, get_tone_presets
from app.services.file_search_service import FileSearchService
from app.services.history_service import HistoryService
from app.schemas.agent import (
    AgentCreate,
    AgentUpdate,
    AgentChatRequest,
    TonePreset,
)
from app.schemas.common import ChatMode
from app.core.config import get_settings
from app.core.logging import app_logger

settings = get_settings()
router = APIRouter(prefix="/agents", tags=["agents"])

# --- Directory for avatar uploads ---
AVATAR_DIR = Path("static/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


def get_agent_service(db: DBSession = Depends(get_db)) -> AgentService:
    return AgentService(db)


def get_file_search_service() -> FileSearchService:
    return FileSearchService()


def get_history_service(db: DBSession = Depends(get_db)) -> HistoryService:
    return HistoryService(db)


# --- Tone Presets ---
@router.get("/tones/presets")
async def list_tone_presets() -> list[TonePreset]:
    """Get available tone presets."""
    return get_tone_presets()


# --- CRUD Operations ---
@router.get("/")
async def list_agents(
    mine: bool = False,
    browse: bool = False,
    service: AgentService = Depends(get_agent_service),
):
    """
    List agents.
    - mine=True: User's custom agents
    - browse=True: Public/default agents
    """
    agents = await service.list_agents(mine=mine, browse=browse)
    return [_agent_to_response(agent) for agent in agents]


@router.get("/{agent_id}")
async def get_agent(
    agent_id: int,
    service: AgentService = Depends(get_agent_service),
):
    """
        Get agent details by ID.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return _agent_to_response(agent)


@router.post("/")
async def create_agent(
    data: AgentCreate,
    service: AgentService = Depends(get_agent_service),
):
    """
        Create a new agent.
    """
    agent = await service.create_agent(
        name=data.name,
        description=data.description,
        instructions=data.instructions,
        guardrails=data.guardrails,
        tone=data.tone,
        custom_tone=data.custom_tone,
        is_public=data.is_public,
    )
    return _agent_to_response(agent)


@router.patch("/{agent_id}")
async def update_agent(
    agent_id: int,
    data: AgentUpdate,
    service: AgentService = Depends(get_agent_service),
):
    """
        Update agent configuration.
    """
    update_data = data.model_dump(exclude_unset=True)
    agent = await service.update_agent(agent_id, **update_data)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return _agent_to_response(agent)


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: int,
    service: AgentService = Depends(get_agent_service),
):
    """
        Delete an agent.
    """
    success = await service.delete_agent(agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"status": "deleted", "id": agent_id}


# --- Avatar Upload ---
@router.post("/{agent_id}/avatar")
async def upload_avatar(
    agent_id: int,
    file: UploadFile = File(...),
    service: AgentService = Depends(get_agent_service),
):
    """
        Upload agent avatar image.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"{agent_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = AVATAR_DIR / filename
    
    # Save file
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    # Update agent
    avatar_url = f"/static/avatars/{filename}"
    await service.update_agent(agent_id, avatar_url=avatar_url)
    
    return {"avatar_url": avatar_url}


# --- Context Files (RAG) ---
@router.post("/{agent_id}/context")
async def upload_context(
    agent_id: int,
    file: UploadFile = File(...),
    service: AgentService = Depends(get_agent_service),
    file_search: FileSearchService = Depends(get_file_search_service),
    db: DBSession = Depends(get_db),
):
    """
        Upload context file for agent RAG.
    """
    from app.db.agent_models import AgentContext
    
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Validate file type
    allowed_types = [
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: PDF, TXT, MD, DOCX"
        )
    
    # Save temp file
    temp_dir = Path("temp_uploads")
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / f"{uuid.uuid4().hex}_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Upload to Gemini File Search
        store_name, _ = await file_search.create_store_and_upload(
            file_path=str(temp_path),
            display_name=file.filename,
        )
        
        # Create context record
        context = AgentContext(
            agent_id=agent_id,
            file_name=file.filename,
            file_search_store_name=store_name,
        )
        db.add(context)
        await db.commit()
        await db.refresh(context)
        
        return {
            "id": context.id,
            "file_name": context.file_name,
            "created_at": context.created_at.isoformat(),
        }
        
    finally:
        file.file.close()
        if temp_path.exists():
            temp_path.unlink()


@router.delete("/{agent_id}/context/{context_id}")
async def delete_context(
    agent_id: int,
    context_id: int,
    service: AgentService = Depends(get_agent_service),
    file_search: FileSearchService = Depends(get_file_search_service),
    db: DBSession = Depends(get_db),
):
    """Remove context file from agent."""
    from app.db.agent_models import AgentContext
    
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    context = await db.get(AgentContext, context_id)
    if not context or context.agent_id != agent_id:
        raise HTTPException(status_code=404, detail="Context not found")
    
    # Delete from Gemini
    await file_search.delete_store(context.file_search_store_name)
    
    # Delete record
    await db.delete(context)
    await db.commit()
    
    return {"status": "deleted", "id": context_id}


# --- Agent Chat ---
@router.post("/{agent_id}/chat")
async def agent_chat(
    agent_id: int,
    request: AgentChatRequest,
    service: AgentService = Depends(get_agent_service),
    history_service: HistoryService = Depends(get_history_service),
):
    """
    Chat with agent.
    - ephemeral=True: Test mode, no history saved
    - ephemeral=False: Creates/uses session with history
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    async def event_generator():
        session_id = request.session_id
        
        # Create session if not ephemeral and no session provided
        if not request.ephemeral and not session_id:
            title = request.message[:30] + "..." if len(request.message) > 30 else request.message
            new_session = await history_service.create_session(
                title=title,
                mode=ChatMode.STANDARD,
                agent_id=agent_id,
            )
            session_id = new_session.id
            yield f"data: {json.dumps({'type': 'session_created', 'session_id': session_id})}\n\n"
        
        # Save user message (if not ephemeral)
        if not request.ephemeral and session_id:
            await history_service.add_message(
                session_id=session_id,
                role="user",
                content=request.message,
            )
        
        # Stream response from agent
        full_response = ""
        citations_data = None
        
        async for chunk in service.chat_stream(agent, request.message):
            yield f"data: {chunk.model_dump_json()}\n\n"
            
            if chunk.type == "token" and chunk.content:
                full_response += chunk.content
            elif chunk.type == "file_citation" and chunk.content:
                citations_data = chunk.content
        
        # Save assistant message (if not ephemeral)
        if not request.ephemeral and session_id:
            await history_service.add_message(
                session_id=session_id,
                role="assistant",
                content=full_response,
                sources=citations_data,
            )
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )


def _agent_to_response(agent) -> dict:
    """Convert Agent model to response dict."""
    guardrails = None
    if agent.guardrails:
        try:
            guardrails = json.loads(agent.guardrails)
        except json.JSONDecodeError:
            guardrails = None
    
    return {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "avatar_url": agent.avatar_url,
        "instructions": agent.instructions,
        "guardrails": guardrails,
        "tone": agent.tone,
        "custom_tone": agent.custom_tone,
        "is_default": agent.is_default,
        "is_public": agent.is_public,
        "created_at": agent.created_at.isoformat() if agent.created_at else None,
        "updated_at": agent.updated_at.isoformat() if agent.updated_at else None,
        "contexts": [
            {
                "id": ctx.id,
                "file_name": ctx.file_name,
                "created_at": ctx.created_at.isoformat() if ctx.created_at else None,
            }
            for ctx in agent.contexts
        ],
    }
