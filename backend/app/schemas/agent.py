from pydantic import BaseModel 
from typing import Optional , List 
from datetime import datetime 

class TonePreset(BaseModel):
    id: str 
    name: str 
    description: str 

class AgentCreate(BaseModel):
    name: str 
    description: Optional[str] = None 
    instructions: str 
    guardrails: Optional[str] = None
    tone: str = "professional"
    custom_tone: Optional[str] = None 
    is_public: bool = False 

class AgentUpdate(BaseModel):
    name: Optional[str] = None 
    description: Optional[str] = None 
    instructions: Optional[str] = None 
    guardrails: Optional[str] = None 
    tone: Optional[str] = None
    custom_tone: Optional[str] = None
    is_public: Optional[bool] = None

class AgentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    avatar_url: Optional[str]
    instructions: str
    guardrails: Optional[List[str]]
    tone: str
    custom_tone: Optional[str]
    is_default: bool
    is_public: bool
    created_at: datetime
    updated_at: datetime
    contexts: List["AgentContextResponse"]
class AgentContextResponse(BaseModel):
    id: int
    file_name: str
    created_at: datetime
class AgentContextCreate(BaseModel):
    agent_id: int
    file_name: str
    file_search_store_name: str
class AgentChatRequest(BaseModel):
    agent_id: int
    message: str
    session_id: Optional[int] = None
    ephemeral: bool = False
