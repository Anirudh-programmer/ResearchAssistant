"""
Report service — the business logic layer between routers and the agent/DB.

Routers should NEVER touch the agent graph or the Report model directly;
they call into this service. This is the "no business logic inside routes"
requirement from the spec made concrete.
"""
import logging
import time
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents import investment_research_graph
from app.models import ApiLog, Report, ReportStatus, Verdict
from app.schemas.report_data import StructuredReport

logger = logging.getLogger(__name__)


async def create_pending_report(db: AsyncSession, user_id: str, company_name: str) -> Report:
    """Create a PENDING report row immediately, before the agent runs, so the
    frontend can navigate to a detail page and poll/stream progress."""
    report = Report(user_id=user_id, company_name=company_name, status=ReportStatus.PENDING)
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def run_analysis(
    db: AsyncSession,
    report: Report,
    llm_provider_override: str | None = None,
) -> Report:
    """
    Runs the LangGraph pipeline for `report` and persists the outcome.
    Always leaves the report in a terminal state (COMPLETED or FAILED) —
    callers never need to handle a report stuck in RUNNING after this returns.
    """
    report.status = ReportStatus.RUNNING
    await db.commit()

    started_at = time.monotonic()
    try:
        result = await investment_research_graph.ainvoke(
            {
                "company_name": report.company_name,
                "llm_provider_override": llm_provider_override,
            }
        )

        if result.get("error") or not result.get("structured_report"):
            report.status = ReportStatus.FAILED
            report.error_message = result.get("error") or "Agent produced no structured report"
            await _log_api_call(db, report.user_id, report.id, "agent_pipeline", success=False,
                                 error_message=report.error_message,
                                 latency_ms=int((time.monotonic() - started_at) * 1000))
            await db.commit()
            await db.refresh(report)
            return report

        structured = StructuredReport.model_validate(result["structured_report"])

        report.status = ReportStatus.COMPLETED
        report.ticker = structured.ticker
        report.verdict = Verdict.INVEST if structured.verdict.value == "INVEST" else Verdict.PASS_
        report.investment_score = structured.investment_score
        report.confidence_score = structured.confidence_score
        report.report_data = result["structured_report"]
        report.completed_at = datetime.now(timezone.utc)
        report.llm_provider_used = llm_provider_override or "default"

        await _log_api_call(db, report.user_id, report.id, "agent_pipeline", success=True,
                             latency_ms=int((time.monotonic() - started_at) * 1000))

    except Exception as exc:  # noqa: BLE001 — top-level safety net, must never crash the request
        logger.exception("Unhandled error running analysis for report %s", report.id)
        report.status = ReportStatus.FAILED
        report.error_message = f"Unexpected error: {exc}"
        await _log_api_call(db, report.user_id, report.id, "agent_pipeline", success=False,
                             error_message=str(exc),
                             latency_ms=int((time.monotonic() - started_at) * 1000))

    await db.commit()
    await db.refresh(report)
    return report


async def get_report_by_id(db: AsyncSession, report_id: str, user_id: str) -> Report | None:
    result = await db.execute(select(Report).where(Report.id == report_id, Report.user_id == user_id))
    return result.scalar_one_or_none()


async def list_reports(
    db: AsyncSession, user_id: str, page: int = 1, page_size: int = 20
) -> tuple[list[Report], int]:
    count_result = await db.execute(select(func.count()).select_from(Report).where(Report.user_id == user_id))
    total = count_result.scalar_one()

    result = await db.execute(
        select(Report)
        .where(Report.user_id == user_id)
        .order_by(Report.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def delete_report(db: AsyncSession, report_id: str, user_id: str) -> bool:
    report = await get_report_by_id(db, report_id, user_id)
    if report is None:
        return False
    await db.delete(report)
    await db.commit()
    return True


async def set_favorite(db: AsyncSession, report_id: str, user_id: str, is_favorite: bool) -> Report | None:
    report = await get_report_by_id(db, report_id, user_id)
    if report is None:
        return None
    report.is_favorite = is_favorite
    await db.commit()
    await db.refresh(report)
    return report


async def _log_api_call(
    db: AsyncSession,
    user_id: str,
    report_id: str | None,
    endpoint: str,
    success: bool,
    latency_ms: int | None = None,
    error_message: str | None = None,
    provider: str = "agent_pipeline",
) -> None:
    log = ApiLog(
        user_id=user_id,
        report_id=report_id,
        provider=provider,
        endpoint=endpoint,
        success=success,
        latency_ms=latency_ms,
        error_message=error_message,
    )
    db.add(log)
    # Caller is responsible for the surrounding commit — keeps this in the
    # same transaction as the report update it's logging.
