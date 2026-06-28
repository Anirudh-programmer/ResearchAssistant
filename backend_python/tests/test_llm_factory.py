"""Tests for the LLM provider factory — the 'graceful missing-provider handling' contract."""
import pytest

from app.llm.base import LLMProviderError
from app.llm.factory import get_llm_provider


def test_raises_clean_error_when_no_provider_configured(monkeypatch):
    monkeypatch.setattr("app.llm.factory.settings.google_api_key", None)
    monkeypatch.setattr("app.llm.factory.settings.openai_api_key", None)
    monkeypatch.setattr("app.llm.factory.settings.anthropic_api_key", None)

    with pytest.raises(LLMProviderError, match="No LLM provider is configured"):
        get_llm_provider()


def test_resolves_to_configured_provider_even_if_not_default(monkeypatch):
    monkeypatch.setattr("app.llm.factory.settings.google_api_key", None)
    monkeypatch.setattr("app.llm.factory.settings.openai_api_key", "fake-key")
    monkeypatch.setattr("app.llm.factory.settings.anthropic_api_key", None)
    monkeypatch.setattr("app.llm.factory.settings.default_llm_provider", "gemini")

    provider = get_llm_provider()
    assert provider.name == "openai"


def test_preferred_override_wins_when_configured(monkeypatch):
    monkeypatch.setattr("app.llm.factory.settings.google_api_key", "fake-key")
    monkeypatch.setattr("app.llm.factory.settings.anthropic_api_key", "fake-key")
    monkeypatch.setattr("app.llm.factory.settings.default_llm_provider", "gemini")

    provider = get_llm_provider(preferred="anthropic")
    assert provider.name == "anthropic"


def test_preferred_override_falls_back_if_unconfigured(monkeypatch):
    monkeypatch.setattr("app.llm.factory.settings.google_api_key", "fake-key")
    monkeypatch.setattr("app.llm.factory.settings.openai_api_key", None)
    monkeypatch.setattr("app.llm.factory.settings.anthropic_api_key", None)
    monkeypatch.setattr("app.llm.factory.settings.default_llm_provider", "gemini")

    # asked for openai, but it's unconfigured -> should fall back to gemini
    provider = get_llm_provider(preferred="openai")
    assert provider.name == "gemini"
