"""Health check + system status — lets the frontend show which providers are live."""
from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["system"])
settings = get_settings()


@router.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@router.get("/status")
async def system_status() -> dict:
    """
    Non-sensitive provider availability — used by the frontend to show
    e.g. "Gemini: connected, Tavily: not configured" without ever exposing
    actual key values.
    """
    return {
        "auth_configured": settings.auth_configured,
        "llm_providers": settings.llm_provider_status(),
        "research_tools": settings.research_tool_status(),
        "default_llm_provider": settings.default_llm_provider,
    }
