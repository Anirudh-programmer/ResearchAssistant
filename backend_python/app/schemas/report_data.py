"""
Schemas for the structured report — this is the contract between the
LangGraph agent's output, the database JSON column, and the frontend.

Defining this once and reusing it everywhere (agent -> DB -> API response)
means the frontend TypeScript types and backend Pydantic types can be kept
in lockstep, and the LLM's structured output has a strict shape to fill.
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class VerdictEnum(str, Enum):
    INVEST = "INVEST"
    PASS_ = "PASS"


class FinancialHealth(BaseModel):
    revenue_trend: str = Field(description="Narrative description of revenue direction over recent periods")
    profitability: str = Field(description="Narrative on margins/profitability state")
    debt_analysis: str = Field(description="Narrative on leverage and balance-sheet risk")
    market_cap: str | None = Field(default=None, description="Market capitalization if available")
    current_price: float | None = Field(default=None, description="Latest known share price")
    pe_ratio: float | None = Field(default=None, description="Price-to-earnings ratio if available")


class SwotAnalysis(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    threats: list[str] = Field(default_factory=list)


class NewsItem(BaseModel):
    title: str
    summary: str
    url: str | None = None
    published_at: str | None = None
    sentiment: str | None = Field(default=None, description="positive | neutral | negative")


class SourceRef(BaseModel):
    name: str
    url: str | None = None
    type: str = Field(description="e.g. 'news', 'financial', 'web_search', 'wikipedia'")


class StructuredReport(BaseModel):
    """The full structured output of one analysis run."""

    company_name: str
    ticker: str | None = None
    industry: str | None = None

    current_summary: str = Field(description="2-4 sentence snapshot of the company today")

    financial_health: FinancialHealth
    competitive_position: str

    recent_news: list[NewsItem] = Field(default_factory=list)
    positive_signals: list[str] = Field(default_factory=list)
    negative_signals: list[str] = Field(default_factory=list)
    major_risks: list[str] = Field(default_factory=list)
    growth_opportunities: list[str] = Field(default_factory=list)

    swot: SwotAnalysis

    investment_score: int = Field(ge=0, le=100, description="0 = avoid entirely, 100 = highest conviction")
    confidence_score: int = Field(ge=0, le=100, description="How confident the agent is in this analysis")
    verdict: VerdictEnum
    detailed_reasoning: str = Field(description="The agent's full chain of reasoning behind the verdict")

    sources: list[SourceRef] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
