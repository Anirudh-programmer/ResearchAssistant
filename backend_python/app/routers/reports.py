"""Report listing, retrieval, deletion, and favoriting — powers History/Dashboard pages."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.report import FavoriteRequest, PaginatedReports, ReportDetail, ReportSummary
from app.services import delete_report, get_report_by_id, list_reports, set_favorite

router = APIRouter(tags=["reports"])


@router.get("/reports", response_model=PaginatedReports)
async def get_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedReports:
    reports, total = await list_reports(db, user.id, page=page, page_size=page_size)
    return PaginatedReports(
        items=[ReportSummary.model_validate(r) for r in reports],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/report/{report_id}", response_model=ReportDetail)
async def get_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportDetail:
    report = await get_report_by_id(db, report_id, user.id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return ReportDetail.model_validate(report)


@router.delete("/report/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    deleted = await delete_report(db, report_id, user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")


@router.post("/favorite", response_model=ReportDetail)
async def favorite_report(
    payload: FavoriteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportDetail:
    report = await set_favorite(db, payload.report_id, user.id, payload.is_favorite)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return ReportDetail.model_validate(report)
