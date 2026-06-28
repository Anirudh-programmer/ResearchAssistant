"""Tavily search — general web research, news, market sentiment queries."""
from app.config import get_settings
from app.tools.base import ToolResult

settings = get_settings()


async def search_tavily(query: str) -> ToolResult:
    if not settings.tavily_api_key:
        return ToolResult.unavailable("tavily", "TAVILY_API_KEY not configured")

    try:
        from tavily import AsyncTavilyClient

        client = AsyncTavilyClient(api_key=settings.tavily_api_key)
        response = await client.search(query=query, max_results=5, search_depth="advanced")

        results = response.get("results", [])
        if not results:
            return ToolResult.unavailable("tavily", "No results returned")

        formatted = "\n".join(
            f"- {r.get('title')}: {r.get('content', '')[:300]}" for r in results
        )
        return ToolResult.ok("tavily", formatted)
    except Exception as exc:
        return ToolResult.unavailable("tavily", f"Request failed: {exc}")
