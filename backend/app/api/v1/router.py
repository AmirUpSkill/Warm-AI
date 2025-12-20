from fastapi import APIRouter
from app.api.v1.endpoints import chat, search

router = APIRouter(prefix="/api/v1")

# --- Include all endpoint routers ---
router.include_router(chat.router)
router.include_router(search.router)
