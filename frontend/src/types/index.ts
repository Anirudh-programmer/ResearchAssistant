/**
 * Types mirror app/schemas/* on the backend exactly. If a field changes
 * there, it must change here too — there is no codegen step in this
 * project, so keeping these in sync by hand is a deliberate trade-off
 * documented in the README ("Trade-offs" section).
 */

export type ReportStatus = "pending" | "running" | "completed" | "failed";
export type Verdict = "INVEST" | "PASS";
export type Sentiment = "positive" | "neutral" | "negative";

export interface FinancialHealth {
  revenue_trend: string;
  profitability: string;
  debt_analysis: string;
  market_cap: string | null;
  current_price: number | null;
  pe_ratio: number | null;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string | null;
  published_at: string | null;
  sentiment: Sentiment | null;
}

export interface SourceRef {
  name: string;
  url: string | null;
  type: string;
}

export interface StructuredReport {
  company_name: string;
  ticker: string | null;
  industry: string | null;
  is_fallback?: boolean;
  current_summary: string;
  financial_health: FinancialHealth;
  competitive_position: string;
  recent_news: NewsItem[];
  positive_signals: string[];
  negative_signals: string[];
  major_risks: string[];
  growth_opportunities: string[];
  swot: SwotAnalysis;
  investment_score: number;
  confidence_score: number;
  verdict: Verdict;
  detailed_reasoning: string;
  sources: SourceRef[];
  generated_at: string;
}

export interface ReportSummary {
  id: string;
  company_name: string;
  ticker: string | null;
  status: ReportStatus;
  verdict: Verdict | null;
  investment_score: number | null;
  confidence_score: number | null;
  is_favorite: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface ReportDetail extends ReportSummary {
  report_data: StructuredReport | null;
  error_message: string | null;
  llm_provider_used: string | null;
}

export interface PaginatedReports {
  items: ReportSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserSettings {
  theme: "dark" | "light" | "system";
  preferred_llm_provider: string | null;
  email_notifications: boolean;
}

export interface SavedCompany {
  id: string;
  company_name: string;
  ticker: string | null;
  notes: string | null;
  created_at: string;
  source?: "manual" | "report";
}

export interface ApiUsageSummary {
  provider: string;
  total_calls: number;
  success_count: number;
  failure_count: number;
  avg_latency_ms: number | null;
}


export interface PopularStock {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  marketCap: number | null;
  peRatio: number | null;
  source: string;
  error?: string;
}

export interface PopularStocksResponse {
  items: PopularStock[];
  generated_at: string;
}
export interface SystemStatus {
  auth_configured: boolean;
  llm_providers: Record<string, boolean>;
  research_tools: Record<string, boolean>;
  default_llm_provider: string;
}

/** Mirrors PIPELINE_STEPS in app/routers/stream.py — keep step ids in sync. */
export interface PipelineStep {
  id: "research_profile" | "collect_news" | "sentiment_and_risk" | "llm_reasoning";
  label: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: "research_profile", label: "Researching company profile" },
  { id: "collect_news", label: "Collecting recent news" },
  { id: "sentiment_and_risk", label: "Analyzing sentiment and risk signals" },
  { id: "llm_reasoning", label: "Reasoning through findings" },
];
