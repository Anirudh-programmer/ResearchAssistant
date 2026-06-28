"""Node 3: market sentiment + early risk signals via targeted web search."""
import asyncio

from app.agents.state import AgentState
from app.tools import search_tavily


async def sentiment_and_risk_node(state: AgentState) -> AgentState:
    company_name = state["company_name"]

    sentiment_result, risk_result = await asyncio.gather(
        search_tavily(f"{company_name} investor sentiment analyst opinion"),
        search_tavily(f"{company_name} risks controversies lawsuits regulatory challenges"),
    )

    return {
        "tool_results": [sentiment_result, risk_result],
        "current_step": "sentiment_and_risk",
        "completed_steps": ["sentiment_and_risk"],
    }
