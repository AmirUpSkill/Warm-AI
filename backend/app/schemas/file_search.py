from pydantic import BaseModel 
from typing import List , Optional 

class FileUploadResponse(BaseModel):
    session_id: int 
    store_name: str 
    file_name: str 
    status: str  # "indexed" | "error"

class FileSearchChatRequest(BaseModel):
    session_id: int 
    message: str 
    model: str = "gemini-2.5-flash"

class FileSearchCitation(BaseModel):
    source_title: str
    text_segment: str 
    start_index: Optional[int] = None 
    end_index: Optional[int] = None
