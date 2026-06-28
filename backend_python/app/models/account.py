"""
Remaining domain models: SavedCompany, ApiLog, UserSettings.

Kept in one file since each is small and they're conceptually a cluster of
"account-level" tables, vs. Report which is the primary domain entity.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class SavedCompany(Base):
    """A company a user has bookmarked for quick re-analysis, independent of any single report."""

    __tablename__ = "saved_companies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)

    company_name: Mapped[str] = mapped_column(String, nullable=False)
    ticker: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="saved_companies")


class ApiLog(Base):
    """
    Lightweight audit/usage log — one row per API call that costs quota
    (LLM calls, research tool calls). Powers the Profile -> API usage page.
    """

    __tablename__ = "api_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    report_id: Mapped[str | None] = mapped_column(String, nullable=True)

    provider: Mapped[str] = mapped_column(String, nullable=False)  # e.g. "gemini", "tavily", "finnhub"
    endpoint: Mapped[str] = mapped_column(String, nullable=False)  # e.g. "generate_content", "search"
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="api_logs")


class UserSettings(Base):
    """Per-user preferences — theme, default LLM provider, notification prefs."""

    __tablename__ = "user_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )

    theme: Mapped[str] = mapped_column(String, default="dark")  # "dark" | "light" | "system"
    preferred_llm_provider: Mapped[str | None] = mapped_column(String, nullable=True)
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="settings")
