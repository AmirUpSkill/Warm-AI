from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime


# --- Agent Model --- 
class Agent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str 
    description: Optional[str] = None 
    avatar_url: Optional[str] = None 
    instructions: Optional[str] = None 
    guardrails: Optional[str] = None  
    tone: str = "professional"
    custom_tone: Optional[str] = None 
    is_default: bool = False 
    is_public: bool = False 
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # --- Relationships --- 
    contexts: List["AgentContext"] = Relationship(back_populates="agent", cascade_delete=True)


# --- AgentContext Model (For Serverless RAG) --- 
class AgentContext(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    agent_id: int = Field(foreign_key="agent.id")
    file_name: str 
    file_search_store_name: str 
    created_at: datetime = Field(default_factory=datetime.utcnow)
    agent: Agent = Relationship(back_populates="contexts")
