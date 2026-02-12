from sqlmodel import SQLModel 

from app.db.models import Session, Message 
from app.db.agent_models import Agent, AgentContext

metadata = SQLModel.metadata