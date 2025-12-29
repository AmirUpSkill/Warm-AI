import json
import tempfile
import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import get_file_search_service, get_history_service
from app.services.file_search_service import FileSearchService
from app.services.history_service import HistoryService
from app.schemas.file_search import FileUploadResponse, FileSearchChatRequest, FileSearchCitation
from app.schemas.common import ChatMode
from app.schemas.chat import ChatStreamResponse
from app.core.logging import app_logger

router = APIRouter(prefix="/file-search", tags=["file_search"])

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    service: FileSearchService = Depends(get_file_search_service),
    history_service: HistoryService = Depends(get_history_service),
):
    """
        Upload a file and create a File Search Store for RAG.
    """
    app_logger.info(f"File upload request: {file.filename}")
    
    # --- Step 1: Validate file ---
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # --- Step 2: Save file temporarily ---
    try:
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            temp_file_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    try:
        # --- Step 3: Create store and upload via service ---
        store_name, file_name = await service.create_store_and_upload(
            file_path=temp_file_path,
            display_name=file.filename
        )
        
        # --- Step 4: Create session with mode=FILE_SEARCH ---
        title = f"File: {file.filename[:30]}" if len(file.filename) > 30 else f"File: {file.filename}"
        session = await history_service.create_session(
            title=title,
            mode=ChatMode.FILE_SEARCH
        )

        # --- Step 5: Store File Search metadata on session ---
        await history_service.update_session_file_search(
            session_id=session.id,
            store_name=store_name,
            file_name=file_name,
        )
        
        return FileUploadResponse(
            session_id=session.id,
            store_name=store_name,
            file_name=file_name,
            status="indexed"
        )
        
    except Exception as e:
        app_logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to index file: {str(e)}")
    
    finally:
        # --- Cleanup temp file ---
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@router.post("/chat")
async def file_search_chat(
    request: FileSearchChatRequest,
    service: FileSearchService = Depends(get_file_search_service),
    history_service: HistoryService = Depends(get_history_service),
):
    """
        Stream RAG response for a file search session.
    """
    
    # ---  Get session to retrieve store_name ---
    session = await history_service.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.file_search_store_name:
        raise HTTPException(status_code=400, detail="No file uploaded for this session")
    
    async def event_generator():
        # --- Save user message ---
        await history_service.add_message(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        
        full_response = ""
        citations_data = []
        
        async for chunk in service.chat_with_file(
            store_name=session.file_search_store_name,
            query=request.message,
            model=request.model
        ):
            yield f"data: {chunk.model_dump_json()}\n\n"
            
            if chunk.type == "token" and chunk.content:
                full_response += chunk.content
            elif chunk.type == "file_citation":
                citations_data = chunk.content
        
        # --- Save assistant response ---
        await history_service.add_message(
            session_id=request.session_id,
            role="assistant",
            content=full_response,
            sources=citations_data if citations_data else None
        )
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


@router.delete("/sessions/{session_id}")
async def delete_file_search_session(
    session_id: int,
    service: FileSearchService = Depends(get_file_search_service),
    history_service: HistoryService = Depends(get_history_service),
):
    """
        Delete a file search session and cleanup the store.
    """
    session = await history_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # --- Cleanup store if it exists ---
    if session.file_search_store_name:
        await service.delete_store(session.file_search_store_name)
    
    # --- Delete session ---
    await history_service.delete_session(session_id)
    
    return {"status": "deleted", "session_id": session_id}