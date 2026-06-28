"""CORS configuration — locked to the configured frontend origin, not '*'."""
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings


def get_cors_kwargs(settings: Settings) -> dict:
    # In development, also allow the Vite default port explicitly in case
    # FRONTEND_ORIGIN hasn't been set yet — never falls back to "*".
    origins = {settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"}
    return {
        "allow_origins": list(origins),
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }


__all__ = ["CORSMiddleware", "get_cors_kwargs"]
