"""
Base interface for research tools.

Every tool wrapper (Tavily, Finnhub, NewsAPI, Wikipedia) implements this
same shape and NEVER raises on missing keys or upstream failures — it
returns a `ToolResult` with `available=False` instead. This is what lets
the LangGraph agent run a full pipeline even when most API keys are unset:
each node just sees "no data from source X" and reasons with what it has.
"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolResult:
    tool_name: str
    available: bool
    data: Any = None
    error: str | None = None
    source_url: str | None = None

    @classmethod
    def unavailable(cls, tool_name: str, reason: str) -> "ToolResult":
        return cls(tool_name=tool_name, available=False, error=reason)

    @classmethod
    def ok(cls, tool_name: str, data: Any, source_url: str | None = None) -> "ToolResult":
        return cls(tool_name=tool_name, available=True, data=data, source_url=source_url)


@dataclass
class ResearchBundle:
    """Everything gathered about a company before the LLM reasons over it."""

    company_name: str
    results: list[ToolResult] = field(default_factory=list)

    def add(self, result: ToolResult) -> None:
        self.results.append(result)

    @property
    def available_results(self) -> list[ToolResult]:
        return [r for r in self.results if r.available]

    @property
    def unavailable_tools(self) -> list[str]:
        return [r.tool_name for r in self.results if not r.available]

    def to_prompt_context(self) -> str:
        """Render all gathered data as a single text block to feed the LLM."""
        if not self.available_results:
            return "No external data sources were available. Reason from general knowledge only."

        sections = []
        for r in self.available_results:
            sections.append(f"### Source: {r.tool_name}\n{r.data}")
        return "\n\n".join(sections)
