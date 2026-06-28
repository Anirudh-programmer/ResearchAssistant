"""
Gemini provider implementation.

Uses the current `google-genai` SDK (the legacy `google-generativeai`
package is deprecated/EOL — see https://github.com/google-gemini/deprecated-generative-ai-python).
Pydantic models are passed directly as `response_schema`; the SDK handles
JSON-schema conversion and validation internally.
"""
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential

from app.llm.base import LLMProvider, LLMProviderError, T


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(system_instruction=system_prompt),
            )
            return response.text or ""
        except Exception as exc:
            raise LLMProviderError(f"Gemini generate_text failed: {exc}") from exc

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    async def generate_structured(self, system_prompt: str, user_prompt: str, schema: type[T]) -> T:
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
            # response.parsed gives a model instance directly when response_schema
            # is a Pydantic class; fall back to manual validation just in case.
            if response.parsed is not None:
                return response.parsed
            return schema.model_validate_json(response.text)
        except Exception as exc:
            raise LLMProviderError(f"Gemini generate_structured failed: {exc}") from exc
