from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.deps import get_gemini_service
from app.services.llm_service import GeminiService
from app.schemas.chat import ChatMessageRequest, ChatStreamResponse
from app.core.logging import app_logger
import json

router = APIRouter(prefix="/chat", tags=["Chat"])


async def event_generator(service: GeminiService, request: ChatMessageRequest):
    """
        Async generator that yields SSE-formatted events from Gemini.
    """
    try:
        async for chunk in service.chat_stream(request.message, request.mode):
            # Format as SSE event
            data = chunk.model_dump_json()
            yield f"data: {data}\n\n"
    except Exception as e:
        app_logger.error(f"Stream error: {str(e)}")
        error_response = ChatStreamResponse(type="error", content=str(e))
        yield f"data: {error_response.model_dump_json()}\n\n"


@router.post("/message")
async def send_message(
    request: ChatMessageRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    """
    Send a message and receive a streaming response.
    
    Uses Server-Sent Events (SSE) to stream tokens back to the client.
    
    **Modes:**
    - `standard`: Pure LLM response
    - `web_search`: Gemini with Google Search grounding
    
    **Response Events:**
    - `token`: A text chunk from the AI
    - `citation`: Source URLs (web_search mode only)
    - `done`: Stream completed
    - `error`: An error occurred
    """
    app_logger.info(f"Chat request | Mode: {request.mode} | Message: {request.message[:50]}...")
    
    return StreamingResponse(
        event_generator(service, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
