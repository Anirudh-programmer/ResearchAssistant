"""
Provider-agnostic LLM interface.

Every concrete provider (Gemini, OpenAI, Anthropic) implements this same
interface. Agent nodes call `LLMProvider.generate_structured(...)` and never
import a vendor SDK directly — that isolation is what makes provider-swapping
a one-file change (app/llm/factory.py) instead of a codebase-wide refactor.
"""
from abc import ABC, abstractmethod
from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMProviderError(Exception):
    """Raised when a provider call fails after retries, or a provider is misconfigured."""


class LLMProvider(ABC):
    name: str

    @abstractmethod
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Plain text completion — used for intermediate reasoning steps."""
        raise NotImplementedError

    @abstractmethod
    async def generate_structured(self, system_prompt: str, user_prompt: str, schema: type[T]) -> T:
        """
        Structured completion — the model's output is parsed and validated
        against `schema`. Used for the final report and any step that needs
        a guaranteed shape rather than free text.
        """
        raise NotImplementedError
