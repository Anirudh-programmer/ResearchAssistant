"""
Application entry point.

Run locally with: uvicorn app.main:app --reload
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.database import init_db
from app.middleware import CORSMiddleware, get_cors_kwargs, register_exception_handlers
from app.routers import account, analyze, reports, stream, system

settings = get_settings()

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev convenience: auto-create tables on SQLite. In staging/production
    # (Postgres), schema is managed by Alembic migrations instead — see
    # alembic/ and the README's "Database Migrations" section.
    if settings.database_url.startswith("sqlite"):
        await init_db()
        logger.info("SQLite dev database initialized")

    logger.info("Default LLM provider: %s", settings.default_llm_provider)
    logger.info("LLM providers configured: %s", settings.llm_provider_status())
    logger.info("Research tools configured: %s", settings.research_tool_status())
    logger.info("Clerk auth configured: %s", settings.auth_configured)

    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-powered investment research agent — multi-source company analysis with structured INVEST/PASS recommendations.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, **get_cors_kwargs(settings))
register_exception_handlers(app)

app.include_router(system.router, prefix=settings.api_v1_prefix)
app.include_router(analyze.router, prefix=settings.api_v1_prefix)
app.include_router(stream.router, prefix=settings.api_v1_prefix)
app.include_router(reports.router, prefix=settings.api_v1_prefix)
app.include_router(account.router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root() -> dict:
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
    }
