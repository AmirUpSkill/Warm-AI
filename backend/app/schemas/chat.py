from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.common import ChatMode

class ChatMessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    mode: ChatMode = ChatMode.STANDARD
    model: str = "gemini-flash-latest"

class SourceCitation(BaseModel):
    title: str
    url: str

class ChatStreamResponse(BaseModel):
    """
        The schema for each chunk in the SSE stream
    """
    type: str  # "token" | "citation" | "done" | "error"
    content: Optional[str] = None
    sources: Optional[List[SourceCitation]] = None