"""
Streaming analysis endpoint — powers the animated, step-by-step pipeline UI.

Uses Server-Sent Events (SSE) rather than WebSockets: progress only flows
server -> client, so SSE is simpler to implement and consume (plain
`EventSource` or `fetch` + `ReadableStream` on the frontend, no socket
lifecycle to manage) and works through standard HTTP infra without
upgrade-header concerns.
"""
import json
import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.services import create_pending_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["analysis"])

# Mirrors the spec's documented workflow exactly, used as the canonical step list
# the frontend's progress tracker renders against.
PIPELINE_STEPS = [
    {"id": "research_profile", "label": "Researching company profile"},
    {"id": "collect_news", "label": "Collecting recent news"},
    {"id": "sentiment_and_risk", "label": "Analyzing sentiment and risk signals"},
    {"id": "llm_reasoning", "label": "Reasoning through findings"},
]


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.get("/stream")
async def analyze_company_stream(
    company_name: str = Query(..., min_length=1, max_length=200),
    llm_provider: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    SSE stream of pipeline progress, ending with the completed report.

    Event types emitted:
      - "step_start"   {step_id, label}
      - "step_complete" {step_id, label}
      - "report"        {report: <ReportDetail-shaped dict>}
      - "error"         {message}
    """
    report = await create_pending_report(db, user.id, company_name)

    async def event_generator():
        from app.agents import investment_research_graph
        from app.models import Report, ReportStatus, Verdict
        from app.schemas.report_data import StructuredReport
        from datetime import datetime, timezone
        import time

        report.status = ReportStatus.RUNNING
        await db.commit()

        started_at = time.monotonic()
        state = {"company_name": company_name, "llm_provider_override": llm_provider}

        try:
            # astream yields the state after each node completes — perfect for
            # driving the step-by-step UI without polling.
            async for chunk in investment_research_graph.astream(state):
                for node_name, node_output in chunk.items():
                    step_meta = next((s for s in PIPELINE_STEPS if s["id"] == node_name), None)
                    if step_meta:
                        yield _sse_event("step_complete", step_meta)
                    state = {**state, **node_output}

            if state.get("error") or not state.get("structured_report"):
                error_message = state.get("error") or "Agent produced no structured report"
                report.status = ReportStatus.FAILED
                report.error_message = error_message
                await db.commit()
                yield _sse_event("error", {"message": error_message})
                return

            structured = StructuredReport.model_validate(state["structured_report"])
            report.status = ReportStatus.COMPLETED
            report.ticker = structured.ticker
            report.verdict = Verdict.INVEST if structured.verdict.value == "INVEST" else Verdict.PASS_
            report.investment_score = structured.investment_score
            report.confidence_score = structured.confidence_score
            report.report_data = state["structured_report"]
            report.completed_at = datetime.now(timezone.utc)
            report.llm_provider_used = llm_provider or "default"
            await db.commit()
            await db.refresh(report)

            yield _sse_event(
                "report",
                {
                    "id": report.id,
                    "company_name": report.company_name,
                    "ticker": report.ticker,
                    "status": report.status.value,
                    "verdict": report.verdict.value if report.verdict else None,
                    "investment_score": report.investment_score,
                    "confidence_score": report.confidence_score,
                    "report_data": state["structured_report"],
                },
            )
        except Exception as exc:  # noqa: BLE001 — stream must always terminate cleanly
            logger.exception("Streaming analysis failed for report %s", report.id)
            report.status = ReportStatus.FAILED
            report.error_message = f"Unexpected error: {exc}"
            await db.commit()
            yield _sse_event("error", {"message": str(exc)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering so events flush immediately
        },
    )
