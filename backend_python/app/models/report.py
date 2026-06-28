"""
Report model — the core entity of the product.

Each completed analysis run is persisted here in full, including the
structured JSON the agent produced, so history/detail pages never need to
re-run the agent to display a past result.
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class ReportStatus(str, PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Verdict(str, PyEnum):
    INVEST = "INVEST"
    PASS_ = "PASS"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)

    company_name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    ticker: Mapped[str | None] = mapped_column(String, nullable=True)

    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus), default=ReportStatus.PENDING, nullable=False
    )
    verdict: Mapped[Verdict | None] = mapped_column(Enum(Verdict), nullable=True)
    investment_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100
    confidence_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100

    # Full structured report (industry, financial health, SWOT, sources, etc.)
    # stored as JSON so the frontend can render it without re-deriving anything.
    report_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    llm_provider_used: Mapped[str | None] = mapped_column(String, nullable=True)

    is_favorite: Mapped[bool] = mapped_column(default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="reports")

    # avoid float precision footguns for scores; computed property if needed later
    @property
    def duration_seconds(self) -> float | None:
        if self.completed_at is None:
            return None
        return (self.completed_at - self.created_at).total_seconds()
