from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.common import ChatMode

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: Optional[str] = None
    created_at: datetime

class SessionSummary(BaseModel):
    """
        Used for the Sidebar list (lightweight)
    """
    id: int
    title: str
    mode: ChatMode
    file_search_store_name: Optional[str] = None
    file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SessionDetail(SessionSummary):
    """
        Used when opening a specific chat
    """
    messages: List[MessageResponse]

class SessionUpdate(BaseModel):
    title: str