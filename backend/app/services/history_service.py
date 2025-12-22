from datetime import datetime
from typing import List, Optional
from sqlmodel import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models import Session, Message
from app.schemas.common import ChatMode

class HistoryService:
    def __init__(self, db: AsyncSession):
        self.db = db 
    async def create_session(self , title: str , mode: ChatMode) -> Session:
        """
            Create a new chat/search session . 
        """
        session = Session(
            title=title,
            mode=mode,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session
    async def get_session(self, session_id: int) -> Optional[Session]:
        """
            Fetch session by ID with messages
        """
        statement = select(Session).where(Session.id == session_id).options(selectinload(Session.messages))
        result = await self.db.execute(statement)
        return result.scalar_one_or_none()
    async def get_user_sessions(self, limit: int = 20, offset: int = 0) -> List[Session]:
        """
            List all sessions ordered by newest first.
        """
        statement = select(Session).order_by(desc(Session.updated_at)).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return result.scalars().all()
    async def add_message(self, session_id: int , role:str , content: str , sources: Optional[str] = None) -> Message:
        """
            Add a message to a session 
        """
        message = Message(
            session_id=session_id,
            role=role,
            content=content,
            sources=sources
        )
        self.db.add(message)
        # --- Update session timestamp --- 
        session = await self.get_session(session_id)
        if session:
            session.updated_at = datetime.utcnow()
            self.db.add(session)

        await self.db.commit()
        await self.db.refresh(message)
        return message
    async def delete_session(self, session_id: int ) -> bool:
        """
            Delete a session and its messages. 
        """
        # First delete all messages associated with the session
        delete_messages_stmt = select(Message).where(Message.session_id == session_id)
        messages_result = await self.db.execute(delete_messages_stmt)
        messages = messages_result.scalars().all()
        
        for message in messages:
            await self.db.delete(message)
        
        # Then delete the session
        session = await self.get_session(session_id)
        if session:
            await self.db.delete(session)
            await self.db.commit()
            return True 
        return False
    async def update_session_title(self, session_id:int , new_title: str ) -> Optional[Session]:
        """
            Update a session title 
        """
        session = await self.get_session(session_id)
        if session:
            session.title = new_title
            session.updated_at = datetime.utcnow()
            self.db.add(session)
            await self.db.commit()
            await self.db.refresh(session)
            return session 
        return None