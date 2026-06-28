"""
Shared state object threaded through every node in the LangGraph pipeline.

Using a single TypedDict (rather than passing loose args between nodes) is
what makes LangGraph's graph wiring possible — every node reads from and
writes back into this same shape, and LangGraph handles merging.
"""
from typing import Annotated, TypedDict

from app.tools.base import ToolResult


def _last_value(_old: object, new: object) -> object:
    """Reducer: last node to write wins (default behavior, made explicit)."""
    return new


class AgentState(TypedDict, total=False):
    # --- input ---
    company_name: str
    llm_provider_override: str | None

    # --- resolved identity ---
    ticker: Annotated[str | None, _last_value]
    industry: Annotated[str | None, _last_value]

    # --- raw research, collected across nodes ---
    tool_results: Annotated[list[ToolResult], lambda old, new: (old or []) + new]

    # --- progress reporting, consumed by the streaming endpoint ---
    current_step: Annotated[str, _last_value]
    completed_steps: Annotated[list[str], lambda old, new: (old or []) + new]

    # --- final output ---
    structured_report: Annotated[dict | None, _last_value]
    error: Annotated[str | None, _last_value]
