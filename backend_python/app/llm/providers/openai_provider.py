"""
OpenAI provider implementation.

Uses the Responses/Chat Completions structured output mode (`response_format`
with a JSON schema derived from the Pydantic model) for guaranteed-shape output.
"""
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.llm.base import LLMProvider, LLMProviderError, T


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model_name = model_name

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            raise LLMProviderError(f"OpenAI generate_text failed: {exc}") from exc

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    async def generate_structured(self, system_prompt: str, user_prompt: str, schema: type[T]) -> T:
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": schema.__name__,
                        "schema": schema.model_json_schema(),
                        "strict": False,  # Pydantic optionals/unions don't always satisfy strict mode
                    },
                },
            )
            content = response.choices[0].message.content or "{}"
            return schema.model_validate_json(content)
        except Exception as exc:
            raise LLMProviderError(f"OpenAI generate_structured failed: {exc}") from exc
