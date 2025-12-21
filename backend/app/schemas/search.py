from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from app.schemas.common import CardType

class PersonCard(BaseModel):
    card_type: CardType = CardType.PERSON
    name: str
    headline: Optional[str] = None
    current_role: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None 
    summary: Optional[str] = Field(None, description="A 1-2 sentence AI-generated summary")
    skills: List[str] = []
    image_url: Optional[str] = None

class CompanyCard(BaseModel):
    card_type: CardType = CardType.COMPANY
    name: str
    industry: str
    founded_year: Optional[int] = None
    description: Optional[str] = None
    location: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None
    estimated_employees: Optional[str] = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=3, example="AI Engineers in Berlin")
    num_results: int = Field(default=5, ge=1, le=20)

class SearchResponse(BaseModel):
    request_id: str
    results: List[PersonCard | CompanyCard]