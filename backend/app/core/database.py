from sqlalchemy.ext.asyncio import AsyncSession , create_async_engine 
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

# --- Let's Create Async Engine --- 
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development"),
    future=True
)

# --- Let's Create Async Session --- 
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db_session() -> AsyncSession:
    """
        Dependency to yield a database session per request .
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session 
        finally:
            await session.close()