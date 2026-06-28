"""Node 1: resolve ticker + gather company profile (Wikipedia + Finnhub profile)."""
import asyncio

from app.agents.state import AgentState
from app.tools import fetch_finnhub_profile, fetch_wikipedia_summary, resolve_ticker


async def research_profile_node(state: AgentState) -> AgentState:
    company_name = state["company_name"]

    ticker_result = await resolve_ticker(company_name)
    ticker = ticker_result.data if ticker_result.available else None

    wiki_result, finnhub_result = await asyncio.gather(
        fetch_wikipedia_summary(company_name),
        fetch_finnhub_profile(ticker) if ticker else _skip("finnhub"),
    )

    return {
        "ticker": ticker,
        "tool_results": [ticker_result, wiki_result, finnhub_result],
        "current_step": "research_profile",
        "completed_steps": ["research_profile"],
    }


async def _skip(name: str):
    from app.tools.base import ToolResult

    return ToolResult.unavailable(name, "Skipped — no ticker resolved")
