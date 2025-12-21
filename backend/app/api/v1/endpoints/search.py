import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_exa_service
from app.services.exa_service import ExaService
from app.schemas.search import SearchRequest, SearchResponse, PersonCard, CompanyCard
from app.core.logging import app_logger
from typing import List

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/people", response_model=SearchResponse)
async def search_people(
    request: SearchRequest,
    service: ExaService = Depends(get_exa_service)
):
    """
    Search for professionals using natural language.
    
    **Example queries:**
    - "AI Engineers in Berlin with 3+ years experience"
    - "Senior Product Managers at FAANG companies"
    - "Founders of fintech startups in London"
    
    Returns a list of PersonCard widgets with structured profile data.
    """
    app_logger.info(f"People search | Query: '{request.query}' | Limit: {request.num_results}")
    
    result = await service.search_people(request.query, request.num_results)
    
    if result.request_id == "error":
        raise HTTPException(
            status_code=503,
            detail={
                "code": "EXA_API_ERROR",
                "message": "Failed to retrieve results from Exa AI. Please try again later."
            }
        )
    
    return SearchResponse(
        request_id=result.request_id,
        results=result.results
    )


@router.post("/companies", response_model=SearchResponse)
async def search_companies(
    request: SearchRequest,
    service: ExaService = Depends(get_exa_service)
):
    """
    Search for companies using natural language.
    
    **Example queries:**
    - "Seed-stage AI startups in London founded in 2024"
    - "Enterprise SaaS companies in the healthcare space"
    - "YC-backed companies in the developer tools space"
    
    Returns a list of CompanyCard widgets with structured company data.
    """
    app_logger.info(f"Company search | Query: '{request.query}' | Limit: {request.num_results}")
    
    result = await service.search_companies(request.query, request.num_results)
    
    if result.request_id == "error":
        raise HTTPException(
            status_code=503,
            detail={
                "code": "EXA_API_ERROR",
                "message": "Failed to retrieve results from Exa AI. Please try again later."
            }
        )
    
    return SearchResponse(
        request_id=result.request_id,
        results=result.results
    )
