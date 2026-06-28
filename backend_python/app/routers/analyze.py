"""
Analysis endpoints — the core product action: submit a company, get a report.

POST /analyze runs synchronously and returns the completed report. A
WebSocket/SSE streaming variant for live progress is provided separately
at /analyze/stream (see app/routers/stream.py) for the animated pipeline UI.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.report import AnalyzeRequest, ReportDetail
from app.services import create_pending_report, get_report_by_id, run_analysis

router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("", response_model=ReportDetail, status_code=status.HTTP_200_OK)
async def analyze_company(
    payload: AnalyzeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportDetail:
    """
    Runs the full research pipeline for a company and returns the completed
    report. For the animated step-by-step UI, use /analyze/stream instead —
    this endpoint blocks until the entire pipeline finishes.
    """
    report = await create_pending_report(db, user.id, payload.company_name)
    report = await run_analysis(db, report, llm_provider_override=payload.llm_provider)
    return ReportDetail.model_validate(report)


@router.post("/{report_id}/retry", response_model=ReportDetail)
async def retry_analysis(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportDetail:
    """Re-runs the pipeline for an existing (typically failed) report, in place."""
    report = await get_report_by_id(db, report_id, user.id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    report = await run_analysis(db, report)
    return ReportDetail.model_validate(report)
