import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.deps import get_gemini_service, get_history_service
from app.services.llm_service import GeminiService
from app.services.history_service import HistoryService
from app.schemas.chat import ChatMessageRequest, ChatStreamResponse, SourceCitation
from app.core.logging import app_logger

router = APIRouter(prefix="/chat", tags=["chat"])

async def event_generator(
    service: GeminiService, 
    history_service: HistoryService,
    request: ChatMessageRequest
):
    """
    Handles:
    1. Session Creation/Retrieval
    2. Message Persistence (User)
    3. Streaming Response
    4. Message Persistence (AI)
    """
    
    # ---  Handle Session ID ---
    session_id = request.conversation_id
    if not session_id:
        title = request.message[:30] + "..." if len(request.message) > 30 else request.message
        new_session = await history_service.create_session(title=title, mode=request.mode)
        session_id = new_session.id
        id_event = {"type": "session_created", "session_id": session_id, "title": title}
        yield f"data: {json.dumps(id_event)}\n\n"

    # ---  Persist User Message ---
    await history_service.add_message(
        session_id=session_id,
        role="user",
        content=request.message
    )

    # --- Stream & Accumulate AI Response ----
    full_response_text = ""
    citations_data = []

    try:
        async for chunk in service.chat_stream(request.message, request.mode, request.model):
            # Pass through to frontend
            yield f"data: {chunk.model_dump_json()}\n\n"
            
            # Accumulate text for DB
            if chunk.type == "token" and chunk.content:
                full_response_text += chunk.content
            
            # Capture citations for DB
            if chunk.type == "citation" and chunk.sources:
                citations_data = chunk.sources

        # 4. Persist AI Message (After stream completes)
        # Convert citations to JSON string if they exist
        sources_json = json.dumps([c.model_dump() for c in citations_data]) if citations_data else None
        
        await history_service.add_message(
            session_id=session_id,
            role="assistant",
            content=full_response_text,
            sources=sources_json
        )

    except Exception as e:
        app_logger.error(f"Stream Error: {str(e)}")
        error_resp = ChatStreamResponse(type="error", content="Error saving chat history.")
        yield f"data: {error_resp.model_dump_json()}\n\n"

@router.post("/message")
async def chat_message(
    request: ChatMessageRequest,
    service: GeminiService = Depends(get_gemini_service),
    history_service: HistoryService = Depends(get_history_service)
):
    return StreamingResponse(
        event_generator(service, history_service, request),
        media_type="text/event-stream"
    )