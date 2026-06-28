"""
Async database engine + session factory.

Works against SQLite locally (zero setup) and Neon Postgres in production —
swap is a single DATABASE_URL change, nothing else in the codebase changes.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# `connect_args` only matters for SQLite; Postgres ignores unknown kwargs gracefully
# when passed via create_async_engine, so we branch explicitly instead.
_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_async_engine(
    settings.database_url,
    echo=settings.app_env == "development",
    future=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a request-scoped session, always closed after."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Create tables directly from models (dev convenience only).
    In staging/production, use Alembic migrations instead — see alembic/.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
