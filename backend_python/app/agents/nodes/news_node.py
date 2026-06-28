"""Node 2: collect recent news (NewsAPI + Finnhub company news + Tavily web search)."""
import asyncio

from app.agents.state import AgentState
from app.tools import fetch_finnhub_news, fetch_news_api, search_tavily
from app.tools.base import ToolResult


async def collect_news_node(state: AgentState) -> AgentState:
    company_name = state["company_name"]
    ticker = state.get("ticker")

    results = await asyncio.gather(
        fetch_news_api(company_name),
        fetch_finnhub_news(ticker) if ticker else _skip("finnhub_news"),
        search_tavily(f"{company_name} latest news recent developments"),
    )

    return {
        "tool_results": list(results),
        "current_step": "collect_news",
        "completed_steps": ["collect_news"],
    }


async def _skip(name: str) -> ToolResult:
    return ToolResult.unavailable(name, "Skipped — no ticker resolved")
