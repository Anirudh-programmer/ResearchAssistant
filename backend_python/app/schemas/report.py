"""
API-facing schemas for the Report resource (distinct from the internal
StructuredReport in report_data.py, which lives *inside* report.report_data).
"""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.report import ReportStatus, Verdict
from app.schemas.report_data import StructuredReport


class AnalyzeRequest(BaseModel):
    company_name: str = Field(min_length=1, max_length=200, examples=["Tesla", "Stripe", "Nvidia"])
    llm_provider: str | None = Field(
        default=None, description="Override the default LLM provider for this run only"
    )


class ReportSummary(BaseModel):
    """Lightweight shape used in list views (history, dashboard recents)."""

    id: str
    company_name: str
    ticker: str | None
    status: ReportStatus
    verdict: Verdict | None
    investment_score: int | None
    confidence_score: int | None
    is_favorite: bool
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ReportDetail(ReportSummary):
    """Full shape used on the report detail page — includes the structured payload."""

    report_data: StructuredReport | None = None
    error_message: str | None = None
    llm_provider_used: str | None = None

    model_config = {"from_attributes": True}


class FavoriteRequest(BaseModel):
    report_id: str
    is_favorite: bool = True


class PaginatedReports(BaseModel):
    items: list[ReportSummary]
    total: int
    page: int
    page_size: int
