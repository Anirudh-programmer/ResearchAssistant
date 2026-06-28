"""
LLM provider factory.

*** THIS IS THE ONE FILE TO TOUCH TO SWAP OR ADD AN LLM PROVIDER. ***

Everywhere else in the codebase (agent nodes, services) calls
`get_llm_provider()` and only ever sees the abstract `LLMProvider` interface.
To add a 4th provider: write app/llm/providers/your_provider.py implementing
LLMProvider, then register it in `_PROVIDER_REGISTRY` below.
"""
from app.config import get_settings
from app.llm.base import LLMProvider, LLMProviderError
from app.llm.providers.anthropic_provider import AnthropicProvider
from app.llm.providers.gemini import GeminiProvider
from app.llm.providers.openai_provider import OpenAIProvider

settings = get_settings()


def _build_gemini() -> LLMProvider:
    if not settings.google_api_key:
        raise LLMProviderError("GOOGLE_API_KEY is not set")
    return GeminiProvider(api_key=settings.google_api_key, model_name=settings.gemini_model)


def _build_openai() -> LLMProvider:
    if not settings.openai_api_key:
        raise LLMProviderError("OPENAI_API_KEY is not set")
    return OpenAIProvider(api_key=settings.openai_api_key, model_name=settings.openai_model)


def _build_anthropic() -> LLMProvider:
    if not settings.anthropic_api_key:
        raise LLMProviderError("ANTHROPIC_API_KEY is not set")
    return AnthropicProvider(api_key=settings.anthropic_api_key, model_name=settings.anthropic_model)


_PROVIDER_REGISTRY = {
    "gemini": _build_gemini,
    "openai": _build_openai,
    "anthropic": _build_anthropic,
}

_FALLBACK_ORDER = ["gemini", "openai", "anthropic"]


def get_llm_provider(preferred: str | None = None) -> LLMProvider:
    """
    Returns a ready-to-use LLMProvider instance.

    Resolution order:
    1. `preferred` argument, if given and configured (e.g. per-request override)
    2. `DEFAULT_LLM_PROVIDER` from settings, if configured
    3. First provider in `_FALLBACK_ORDER` that has a key set

    Raises LLMProviderError only if NO provider is configured at all —
    this is the "graceful handling of missing providers" behavior in practice.
    """
    candidates = [preferred, settings.default_llm_provider, *_FALLBACK_ORDER]
    tried: set[str] = set()

    for name in candidates:
        if not name or name in tried or name not in _PROVIDER_REGISTRY:
            continue
        tried.add(name)
        try:
            return _PROVIDER_REGISTRY[name]()
        except LLMProviderError:
            continue  # key missing for this one — fall through to the next candidate

    configured = [k for k, v in settings.llm_provider_status().items() if v]
    raise LLMProviderError(
        "No LLM provider is configured. Set at least one of GOOGLE_API_KEY, "
        f"OPENAI_API_KEY, ANTHROPIC_API_KEY in .env. (Currently configured: {configured or 'none'})"
    )
