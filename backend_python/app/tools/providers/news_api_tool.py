"""NewsAPI.org — recent news articles mentioning the company (free tier)."""
from app.config import get_settings
from app.tools.base import ToolResult

settings = get_settings()

NEWS_API_URL = "https://newsapi.org/v2/everything"


async def fetch_news_api(company_name: str) -> ToolResult:
    if not settings.news_api_key:
        return ToolResult.unavailable("news_api", "NEWS_API_KEY not configured")

    try:
        import httpx

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                NEWS_API_URL,
                params={
                    "q": company_name,
                    "sortBy": "publishedAt",
                    "language": "en",
                    "pageSize": 8,
                    "apiKey": settings.news_api_key,
                },
            )
            response.raise_for_status()
            data = response.json()

        articles = data.get("articles", [])
        if not articles:
            return ToolResult.unavailable("news_api", "No articles found")

        formatted = "\n".join(
            f"- [{a.get('publishedAt', '')[:10]}] {a.get('title', '')} ({a.get('source', {}).get('name', '')})"
            f"\n  {a.get('description', '') or ''}"
            for a in articles
        )
        return ToolResult.ok("news_api", formatted)
    except Exception as exc:
        return ToolResult.unavailable("news_api", f"Request failed: {exc}")
