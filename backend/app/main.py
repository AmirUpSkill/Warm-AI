from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1.router import router as v1_router
from app.core.config import get_settings
from app.core.logging import app_logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
        Application lifespan events.
    """
    app_logger.info("🚀 Warm AI Backend starting up...")
    app_logger.info(f"📍 Environment: {settings.ENVIRONMENT}")
    yield
    app_logger.info("👋 Warm AI Backend shutting down...")


# --- Create FastAPI Application ---
app = FastAPI(
    title="Warm AI",
    description="AI-Native LinkedIn Intelligence & Automation Platform",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# --- CORS Configuration (Must be before routes) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://127.0.0.1:8080", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- Include Routers ---
app.include_router(v1_router)


# --- Health Check ---
@app.get("/health", tags=["Health"])
async def health_check():
    """
        Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0"
    }


# --- Root Redirect ---
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info."""
    return {
        "message": "Welcome to Warm AI API",
        "docs": "/docs",
        "health": "/health"
    }
