"""Tests for research tool wrappers — every tool must degrade gracefully, never raise."""
import pytest

from app.tools import fetch_finnhub_profile, fetch_news_api, resolve_ticker, search_tavily


@pytest.mark.asyncio
async def test_tavily_unavailable_without_key(monkeypatch):
    monkeypatch.setattr("app.tools.providers.tavily_tool.settings.tavily_api_key", None)
    result = await search_tavily("Tesla")
    assert result.available is False
    assert "TAVILY_API_KEY" in result.error


@pytest.mark.asyncio
async def test_finnhub_unavailable_without_key(monkeypatch):
    monkeypatch.setattr("app.tools.providers.finnhub_tool.settings.finnhub_api_key", None)
    result = await fetch_finnhub_profile("TSLA")
    assert result.available is False
    assert "FINNHUB_API_KEY" in result.error


@pytest.mark.asyncio
async def test_finnhub_unavailable_without_ticker(monkeypatch):
    monkeypatch.setattr("app.tools.providers.finnhub_tool.settings.finnhub_api_key", "fake-key")
    result = await fetch_finnhub_profile("")
    assert result.available is False


@pytest.mark.asyncio
async def test_news_api_unavailable_without_key(monkeypatch):
    monkeypatch.setattr("app.tools.providers.news_api_tool.settings.news_api_key", None)
    result = await fetch_news_api("Tesla")
    assert result.available is False
    assert "NEWS_API_KEY" in result.error


@pytest.mark.asyncio
async def test_ticker_resolver_unavailable_without_key(monkeypatch):
    monkeypatch.setattr("app.tools.providers.ticker_resolver.settings.finnhub_api_key", None)
    result = await resolve_ticker("Tesla")
    assert result.available is False
