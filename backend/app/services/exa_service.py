import json
import re
from typing import List, Optional, Tuple
from dataclasses import dataclass
from exa_py import Exa
from app.core.config import get_settings
from app.core.logging import app_logger
from app.schemas.search import PersonCard, CompanyCard, SearchResponse
from app.schemas.common import CardType

settings = get_settings()


@dataclass
class ExaSearchResult:
    """
        Wrapper for Exa search response with request tracking.
    """
    request_id: str
    results: List[PersonCard] | List[CompanyCard]


class ExaService:
    """
    Exa AI Integration Service for LinkedIn-style professional search.
    
    Features:
    - People Search: Find professionals by skills, location, experience
    - Company Search: Find companies by industry, funding stage, founded year
    - Structured output mapping to Pydantic schemas
    """
    
    def __init__(self):
        self.client = Exa(api_key=settings.EXA_API_KEY)
        app_logger.info("ExaService initialized")
    
    # --- Helper Methods ---
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extracts skills from the raw LinkedIn text.
        Looks for common skill patterns in the '## Skills' section.
        """
        if not text:
            return []
        
        skills = []
        # Look for skills section in Exa's markdown format
        skills_match = re.search(r'## Skills\n(.+?)(?:\n##|\Z)', text, re.DOTALL)
        if skills_match:
            skills_text = skills_match.group(1)
            # Skills are usually bullet-separated or comma-separated
            raw_skills = re.split(r'[•,\n]', skills_text)
            skills = [s.strip() for s in raw_skills if s.strip() and len(s.strip()) < 50]
            # Limit to top 10 skills
            skills = skills[:10]
        
        return skills
    
    def _extract_location_from_text(self, text: str) -> Optional[str]:
        """
            Extracts location from Exa's LinkedIn data format.
        """
        if not text:
            return None
        
        # Exa formats location like: "City, Country (CC)"
        loc_match = re.search(r'^(.+?, .+?) \([A-Z]{2}\)', text, re.MULTILINE)
        if loc_match:
            return loc_match.group(1)
        return None
    
    def _parse_headline(self, title: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Parses the title to extract current_role and company.
        Example: "John Doe | AI Engineer at Google" -> ("AI Engineer", "Google")
        """
        if not title:
            return None, None
        
        # Remove the name part (before the pipe)
        if "|" in title:
            title = title.split("|", 1)[-1].strip()
        
        # Look for "Role at Company" pattern
        at_match = re.search(r'(.+?)\s+(?:at|@)\s+(.+?)(?:\s*\||$)', title, re.IGNORECASE)
        if at_match:
            return at_match.group(1).strip(), at_match.group(2).strip()
        
        return title, None
    
    def _is_linkedin_url(self, url: str) -> bool:
        """Check if URL is a LinkedIn URL."""
        return "linkedin.com" in url.lower() if url else False
    
    # --- Main Search Methods ---
    
    def search_people(self, query: str, num_results: int = 5) -> ExaSearchResult:
        """
        Searches for professionals using Exa's 'people' category.
        
        Args:
            query: Natural language query (e.g., "AI Engineer in Berlin with 3 years exp")
            num_results: Number of results to return (1-20)
            
        Returns:
            ExaSearchResult with request_id and List[PersonCard]
        """
        app_logger.info(f"Exa People Search | Query: '{query}' | Limit: {num_results}")
        
        try:
            response = self.client.search_and_contents(
                query,
                type="auto",
                category="people",
                text=True,
                num_results=num_results
            )
            
            request_id = getattr(response, 'requestId', 'unknown')
            app_logger.info(f"Exa Response | Request ID: {request_id} | Results: {len(response.results)}")

            results = []
            for res in response.results:
                # --- Extract name (author field or parse from title) ---
                name = res.author if res.author else "Unknown Professional"
                
                # --- Extract headline and parse role/company ---
                headline = res.title if res.title else None
                current_role, company = self._parse_headline(res.title)
                
                # --- Extract location from text ---
                location = self._extract_location_from_text(res.text) if res.text else None
                
                # --- Extract skills from text ---
                skills = self._extract_skills_from_text(res.text) if res.text else []
                
                # --- Build summary (first 250 chars of text) ---
                summary = None
                if res.text:
                    # Get first paragraph or 250 chars
                    clean_text = res.text.replace("#", "").strip()
                    summary = clean_text[:250] + "..." if len(clean_text) > 250 else clean_text
                
                # --- Extract image URL (Exa provides 'image' field) ---
                image_url = getattr(res, 'image', None)
                
                card = PersonCard(
                    card_type=CardType.PERSON,
                    name=name,
                    headline=headline,
                    current_role=current_role,
                    company=company,
                    location=location,
                    linkedin_url=res.url,
                    summary=summary,
                    skills=skills,
                    image_url=image_url
                )
                results.append(card)
            
            return ExaSearchResult(request_id=request_id, results=results)

        except Exception as e:
            app_logger.error(f"Exa People Search Failed: {str(e)}")
            return ExaSearchResult(request_id="error", results=[])

    def search_companies(self, query: str, num_results: int = 5) -> ExaSearchResult:
        """
        Searches for companies using Exa's Summary feature with JSON schema.
        
        Args:
            query: Natural language query (e.g., "Seed-stage AI startups in London")
            num_results: Number of results to return (1-20)
            
        Returns:
            ExaSearchResult with request_id and List[CompanyCard]
        """
        app_logger.info(f"Exa Company Search | Query: '{query}' | Limit: {num_results}")

        # --- Define schema for structured output ---
        company_schema = {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Official company name"},
                "industry": {"type": "string", "description": "Primary industry sector"},
                "founding_year": {"type": "number", "description": "Year company was founded"},
                "description": {"type": "string", "description": "Brief company description"},
                "location": {"type": "string", "description": "Headquarters location"},
                "estimated_employees": {"type": "string", "description": "Employee count range"}
            },
            "required": ["company_name", "industry"]
        }

        try:
            response = self.client.search_and_contents(
                query,
                type="auto",
                category="company",
                num_results=num_results,
                summary={"schema": company_schema}
            )
            
            request_id = getattr(response, 'requestId', 'unknown')
            app_logger.info(f"Exa Response | Request ID: {request_id} | Results: {len(response.results)}")

            results = []
            for res in response.results:
                # --- Set default values ---
                name = res.title or "Unknown Company"
                industry = "Technology"
                founded = None
                desc = None
                loc = None
                employees = None

                # --- Parse Exa summary JSON ---
                if hasattr(res, 'summary') and res.summary:
                    try:
                        data = json.loads(res.summary)
                        name = data.get("company_name") or res.title or "Unknown Company"
                        industry = data.get("industry") or "Technology"
                        founded = data.get("founding_year")
                        desc = data.get("description")
                        loc = data.get("location")
                        employees = data.get("estimated_employees")
                    except json.JSONDecodeError:
                        app_logger.warning(f"Failed to parse summary JSON for {res.url}")

                # --- Determine if URL is LinkedIn or Website ---
                linkedin_url = None
                website_url = None
                
                if self._is_linkedin_url(res.url):
                    linkedin_url = res.url
                else:
                    website_url = res.url

                card = CompanyCard(
                    card_type=CardType.COMPANY,
                    name=name,
                    industry=industry,
                    founded_year=int(founded) if founded else None,
                    description=desc,
                    location=loc,
                    website_url=website_url,
                    linkedin_url=linkedin_url,
                    estimated_employees=str(employees) if employees else None
                )
                results.append(card)

            return ExaSearchResult(request_id=request_id, results=results)

        except Exception as e:
            app_logger.error(f"Exa Company Search Failed: {str(e)}")
            return ExaSearchResult(request_id="error", results=[])