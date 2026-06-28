"""
Anthropic provider implementation.

Claude does not have a native "response_schema" parameter like Gemini, so
structured output is achieved via tool-use: we define a single tool whose
input schema IS the Pydantic schema, force the model to call it, and read
the parsed arguments back out. This is the standard reliable pattern for
structured output with Claude.
"""
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from app.llm.base import LLMProvider, LLMProviderError, T


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self, api_key: str, model_name: str = "claude-sonnet-4-6"):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model_name = model_name

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = await self.client.messages.create(
                model=self.model_name,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return "".join(block.text for block in response.content if block.type == "text")
        except Exception as exc:
            raise LLMProviderError(f"Anthropic generate_text failed: {exc}") from exc

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    async def generate_structured(self, system_prompt: str, user_prompt: str, schema: type[T]) -> T:
        try:
            tool_name = f"emit_{schema.__name__.lower()}"
            response = await self.client.messages.create(
                model=self.model_name,
                max_tokens=4096,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                tools=[
                    {
                        "name": tool_name,
                        "description": f"Emit the result as a {schema.__name__} object.",
                        "input_schema": schema.model_json_schema(),
                    }
                ],
                tool_choice={"type": "tool", "name": tool_name},
            )
            for block in response.content:
                if block.type == "tool_use" and block.name == tool_name:
                    return schema.model_validate(block.input)
            raise LLMProviderError("Anthropic did not return the expected tool_use block")
        except Exception as exc:
            raise LLMProviderError(f"Anthropic generate_structured failed: {exc}") from exc
