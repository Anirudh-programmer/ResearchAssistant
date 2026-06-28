"""
Resolves a free-text company name (e.g. "Tesla") to a stock ticker (e.g.
"TSLA") using Finnhub's symbol-lookup endpoint. Falls back to returning
None if unresolved — downstream financial tools then skip gracefully
rather than querying garbage.
"""
import asyncio

from app.config import get_settings
from app.tools.base import ToolResult

settings = get_settings()


async def resolve_ticker(company_name: str) -> ToolResult:
    if not settings.finnhub_api_key:
        return ToolResult.unavailable("ticker_resolver", "FINNHUB_API_KEY not configured")

    try:
        import finnhub

        client = finnhub.Client(api_key=settings.finnhub_api_key)
        results = await asyncio.to_thread(client.symbol_lookup, company_name)

        matches = results.get("result", []) if isinstance(results, dict) else []
        # Prefer common stock listings over ADRs/ETFs/etc. when available
        common = [m for m in matches if m.get("type") == "Common Stock"]
        best = (common or matches)[0] if matches else None

        if not best:
            return ToolResult.unavailable("ticker_resolver", f"No ticker found for '{company_name}'")

        return ToolResult.ok("ticker_resolver", best.get("symbol"))
    except Exception as exc:
        return ToolResult.unavailable("ticker_resolver", f"Lookup failed: {exc}")
