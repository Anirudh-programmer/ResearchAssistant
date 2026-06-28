"""
Centralized application settings.

Every other module reads configuration from here — nothing in the codebase
should call `os.environ` directly. This keeps env var access in ONE place,
which is what makes graceful provider fallback and `.env` validation possible.
"""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    app_env: Literal["development", "staging", "production"] = "development"
    app_name: str = "Investment Research Agent"
    api_v1_prefix: str = "/api/v1"
    frontend_origin: str = "http://localhost:5173"
    log_level: str = "INFO"

    # --- Database ---
    database_url: str = "sqlite+aiosqlite:///./dev.db"

    # --- Clerk Auth ---
    clerk_secret_key: str | None = None
    clerk_publishable_key: str | None = None
    clerk_jwks_url: str | None = None
    clerk_issuer: str | None = None

    # --- LLM providers ---
    default_llm_provider: Literal["gemini", "openai", "anthropic"] = "gemini"
    google_api_key: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    gemini_model: str = "gemini-2.0-flash"
    openai_model: str = "gpt-4o-mini"
    anthropic_model: str = "claude-sonnet-4-6"

    # --- Research tools ---
    tavily_api_key: str | None = None
    news_api_key: str | None = None
    finnhub_api_key: str | None = None

    # --- Misc ---
    secret_key: str = "change-me-to-a-random-string"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def auth_configured(self) -> bool:
        """Whether Clerk is fully configured. If False, auth falls back to dev mode."""
        return bool(self.clerk_secret_key and self.clerk_jwks_url and self.clerk_issuer)

    def llm_provider_status(self) -> dict[str, bool]:
        """Which LLM providers currently have a key configured."""
        return {
            "gemini": bool(self.google_api_key),
            "openai": bool(self.openai_api_key),
            "anthropic": bool(self.anthropic_api_key),
        }

    def research_tool_status(self) -> dict[str, bool]:
        """Which research tools currently have a key configured."""
        return {
            "tavily": bool(self.tavily_api_key),
            "news_api": bool(self.news_api_key),
            "finnhub": bool(self.finnhub_api_key),
        }


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — env is read once per process."""
    return Settings()
