import json
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_exa_service, get_history_service
from app.services.exa_service import ExaService
from app.services.history_service import HistoryService
from app.schemas.search import SearchRequest, SearchResponse
from app.schemas.common import ChatMode, CardType
from app.core.logging import app_logger

router = APIRouter(prefix="/search", tags=["search"])

@router.post("/people", response_model=SearchResponse)
async def search_people(
    request: SearchRequest,
    service: ExaService = Depends(get_exa_service),
    history_service: HistoryService = Depends(get_history_service)
):
    app_logger.info(f"People search: {request.query}")
    
    # ---  Execute Search --- 
    result = await service.search_people(request.query, request.num_results)
    
    if result.request_id == "error":
        raise HTTPException(status_code=503, detail="Exa API Error")

    # --- Persist History ---
    # ---  Create Session 
    title = f"People: {request.query}"
    # Reuse existing chat modes so we don't rely on enum extensions
    session = await history_service.create_session(title=title, mode=ChatMode.WEB_SEARCH)
    
    # Save Query
    await history_service.add_message(session_id=session.id, role="user", content=request.query)
    
    # Save Results (Serialize Cards to JSON string)
    # We use model_dump() to convert Pydantic models to dicts
    results_json = json.dumps([r.model_dump(mode='json') for r in result.results])
    
    await history_service.add_message(
        session_id=session.id, 
        role="assistant", 
        content=results_json # <--- Storing cards JSON in content column
    )

    return SearchResponse(request_id=result.request_id, results=result.results)

@router.post("/companies", response_model=SearchResponse)
async def search_companies(
    request: SearchRequest,
    service: ExaService = Depends(get_exa_service),
    history_service: HistoryService = Depends(get_history_service)
):
    app_logger.info(f"Company search: {request.query}")
    
    # 1. Execute Search
    result = await service.search_companies(request.query, request.num_results)
    
    if result.request_id == "error":
        raise HTTPException(status_code=503, detail="Exa API Error")

    # 2. Persist History
    title = f"Company: {request.query}"
    session = await history_service.create_session(title=title, mode=ChatMode.WEB_SEARCH)
    
    await history_service.add_message(session_id=session.id, role="user", content=request.query)
    
    results_json = json.dumps([r.model_dump(mode='json') for r in result.results])
    
    await history_service.add_message(
        session_id=session.id, 
        role="assistant", 
        content=results_json
    )

    return SearchResponse(request_id=result.request_id, results=result.results)