"""
Wikipedia — company background/profile. No API key required, so this is
the one source guaranteed to work even with zero keys configured, which
matters for the "graceful degradation" requirement: the agent should never
return an empty report just because paid keys are unset.
"""
import asyncio

from app.tools.base import ToolResult


async def fetch_wikipedia_summary(company_name: str) -> ToolResult:
    try:
        import wikipedia

        page_title = await asyncio.to_thread(wikipedia.search, company_name, results=1)
        if not page_title:
            return ToolResult.unavailable("wikipedia", f"No Wikipedia page found for '{company_name}'")

        page = await asyncio.to_thread(wikipedia.page, page_title[0], auto_suggest=False)
        summary = await asyncio.to_thread(wikipedia.summary, page_title[0], sentences=8, auto_suggest=False)

        return ToolResult.ok("wikipedia", summary, source_url=page.url)
    except Exception as exc:
        return ToolResult.unavailable("wikipedia", f"Lookup failed: {exc}")
