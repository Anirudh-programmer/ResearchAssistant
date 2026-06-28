"""Finnhub — real-time quote, company profile, basic financials (free tier)."""
import asyncio

from app.config import get_settings
from app.tools.base import ToolResult

settings = get_settings()


async def fetch_finnhub_profile(ticker: str) -> ToolResult:
    """Company profile + real-time quote. Requires a resolved ticker symbol."""
    if not settings.finnhub_api_key:
        return ToolResult.unavailable("finnhub", "FINNHUB_API_KEY not configured")
    if not ticker:
        return ToolResult.unavailable("finnhub", "No ticker symbol resolved for this company")

    try:
        import finnhub

        client = finnhub.Client(api_key=settings.finnhub_api_key)

        # finnhub-python is sync; run it off the event loop thread so it
        # doesn't block other concurrent agent nodes.
        profile, quote, metrics = await asyncio.gather(
            asyncio.to_thread(client.company_profile2, symbol=ticker),
            asyncio.to_thread(client.quote, ticker),
            asyncio.to_thread(client.company_basic_financials, ticker, "all"),
        )

        if not profile and not quote:
            return ToolResult.unavailable("finnhub", f"No data found for ticker '{ticker}'")

        metric = metrics.get("metric", {}) if isinstance(metrics, dict) else {}

        summary_lines = [
            f"Company: {profile.get('name', 'N/A')}",
            f"Industry: {profile.get('finnhubIndustry', 'N/A')}",
            f"Market Cap: {profile.get('marketCapitalization', 'N/A')} (million USD)",
            f"Current Price: {quote.get('c', 'N/A')}",
            f"Previous Close: {quote.get('pc', 'N/A')}",
            f"52-Week High: {metric.get('52WeekHigh', 'N/A')}",
            f"52-Week Low: {metric.get('52WeekLow', 'N/A')}",
            f"P/E Ratio (TTM): {metric.get('peTTM', 'N/A')}",
            f"Debt-to-Equity: {metric.get('totalDebt/totalEquityQuarterly', 'N/A')}",
            f"Revenue Growth (YoY): {metric.get('revenueGrowthTTMYoy', 'N/A')}",
            f"Net Margin (TTM): {metric.get('netProfitMarginTTM', 'N/A')}",
        ]
        return ToolResult.ok("finnhub", "\n".join(summary_lines))
    except Exception as exc:
        return ToolResult.unavailable("finnhub", f"Request failed: {exc}")


async def fetch_finnhub_news(ticker: str) -> ToolResult:
    """Recent company news. Requires a resolved ticker symbol."""
    if not settings.finnhub_api_key:
        return ToolResult.unavailable("finnhub_news", "FINNHUB_API_KEY not configured")
    if not ticker:
        return ToolResult.unavailable("finnhub_news", "No ticker symbol resolved for this company")

    try:
        import finnhub
        from datetime import datetime, timedelta

        client = finnhub.Client(api_key=settings.finnhub_api_key)
        today = datetime.utcnow().date()
        month_ago = today - timedelta(days=30)

        news = await asyncio.to_thread(
            client.company_news,
            ticker,
            _from=month_ago.isoformat(),
            to=today.isoformat(),
        )
        if not news:
            return ToolResult.unavailable("finnhub_news", "No recent news found")

        formatted = "\n".join(
            f"- [{n.get('datetime', '')}] {n.get('headline', '')}: {n.get('summary', '')[:200]}"
            for n in news[:8]
        )
        return ToolResult.ok("finnhub_news", formatted)
    except Exception as exc:
        return ToolResult.unavailable("finnhub_news", f"Request failed: {exc}")
