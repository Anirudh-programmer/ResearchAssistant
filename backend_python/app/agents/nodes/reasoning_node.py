"""
Final node: feed all gathered research to the LLM and get back the
structured INVEST/PASS report. This is the "LLM reasoning" + "final
recommendation" steps from the spec's workflow, combined into one call
since the structured-output schema already captures every required field.
"""
from app.agents.state import AgentState
from app.llm import get_llm_provider
from app.llm.base import LLMProviderError
from app.schemas.report_data import StructuredReport
from app.tools.base import ResearchBundle, ToolResult

SYSTEM_PROMPT = """You are a rigorous, skeptical investment analyst at a long-only equity \
research desk. You are given raw research about a company gathered from multiple sources \
(company profile, financial metrics, recent news, web search results on sentiment and risk). \
Some sources may be unavailable — reason only from what is actually provided, and be explicit \
in your reasoning when data is missing rather than inventing numbers.

Your job:
1. Synthesize all provided research into a coherent picture of the company.
2. Identify concrete positive signals, negative signals, risks, and growth opportunities — \
each grounded in something from the provided research, not generic boilerplate.
3. Produce a SWOT analysis.
4. Assign an investment_score (0-100): your conviction in the investment opportunity itself.
5. Assign a confidence_score (0-100): how confident YOU are in this analysis, which should be \
LOWER when key data sources (financials, news) were unavailable.
6. Give a final verdict of either INVEST or PASS, with detailed, specific reasoning — not \
hedged platitudes. Take a real position.

Be specific. Cite concrete facts from the research in your reasoning wherever possible. If \
financial data was unavailable, say so explicitly and lower your confidence_score accordingly \
rather than guessing at numbers."""


def _build_user_prompt(company_name: str, ticker: str | None, bundle: ResearchBundle) -> str:
    parts = [
        f"Company to analyze: {company_name}",
        f"Resolved ticker: {ticker or 'Not resolved — treat as a private/unlisted or unmatched company'}",
        "",
        "=== RESEARCH GATHERED ===",
        bundle.to_prompt_context(),
    ]
    if bundle.unavailable_tools:
        parts.append(
            f"\n=== UNAVAILABLE SOURCES (factor into confidence_score) ===\n"
            f"{', '.join(bundle.unavailable_tools)}"
        )
    return "\n".join(parts)


async def reasoning_node(state: AgentState) -> AgentState:
    company_name = state["company_name"]
    ticker = state.get("ticker")
    raw_results: list[ToolResult] = state.get("tool_results", [])

    bundle = ResearchBundle(company_name=company_name)
    for r in raw_results:
        bundle.add(r)

    user_prompt = _build_user_prompt(company_name, ticker, bundle)

    try:
        provider = get_llm_provider(preferred=state.get("llm_provider_override"))
        report: StructuredReport = await provider.generate_structured(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            schema=StructuredReport,
        )

        # Ensure identity fields match what we resolved, regardless of what the LLM echoed back
        report.company_name = company_name
        report.ticker = ticker or report.ticker

        return {
            "structured_report": report.model_dump(mode="json"),
            "current_step": "completed",
            "completed_steps": ["llm_reasoning", "final_recommendation"],
        }
    except LLMProviderError as exc:
        return {
            "error": str(exc),
            "current_step": "failed",
            "completed_steps": ["llm_reasoning_failed"],
        }
