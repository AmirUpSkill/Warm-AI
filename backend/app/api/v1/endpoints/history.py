from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.api.deps import get_history_service
from app.services.history_service import HistoryService
from app.schemas.history import SessionSummary, SessionDetail, SessionUpdate

router = APIRouter()

@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions(
    skip: int = 0,
    limit: int = 20,
    service: HistoryService = Depends(get_history_service)
):
    """
        Get list of past sessions
    """
    return await service.get_user_sessions(limit=limit, offset=skip)

@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session_history(
    session_id: int,
    service: HistoryService = Depends(get_history_service)
):
    """
        Load a specific conversation
    """
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.patch("/sessions/{session_id}", response_model=SessionSummary)
async def rename_session(
    session_id: int,
    update: SessionUpdate,
    service: HistoryService = Depends(get_history_service)
):
    """
        Rename a chat session
    """
    session = await service.update_session_title(session_id, update.title)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    service: HistoryService = Depends(get_history_service)
):
    """
        Delete a session permanently
    """
    success = await service.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "id": session_id}