import { z } from 'zod';

export const FinancialHealthSchema = z.object({
  revenue_trend: z.string().describe('Narrative description of revenue direction over recent periods'),
  profitability: z.string().describe('Narrative on margins/profitability state'),
  debt_analysis: z.string().describe('Narrative on leverage and balance-sheet risk'),
  market_cap: z.string().optional().describe('Market capitalization if available'),
  current_price: z.number().optional().describe('Latest known share price'),
  pe_ratio: z.number().optional().describe('Price-to-earnings ratio if available'),
});

export const SwotAnalysisSchema = z.object({
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  threats: z.array(z.string()).default([]),
});

export const NewsItemSchema = z.object({
  title: z.string(),
  summary: z.string(),
  url: z.string().optional(),
  published_at: z.string().optional(),
  sentiment: z.string().optional().describe('positive | neutral | negative'),
});

export const SourceRefSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  type: z.string().describe("e.g. 'news', 'financial', 'web_search', 'wikipedia'"),
});

export const StructuredReportSchema = z.object({
  company_name: z.string(),
  ticker: z.string().optional(),
  industry: z.string().optional(),
  is_fallback: z.boolean().optional().default(false),
  current_summary: z.string().describe('2-4 sentence snapshot of the company today'),
  financial_health: FinancialHealthSchema,
  competitive_position: z.string(),
  recent_news: z.array(NewsItemSchema).default([]),
  positive_signals: z.array(z.string()).default([]),
  negative_signals: z.array(z.string()).default([]),
  major_risks: z.array(z.string()).default([]),
  growth_opportunities: z.array(z.string()).default([]),
  swot: SwotAnalysisSchema,
  investment_score: z.number().min(0).max(100).describe('0 = avoid entirely, 100 = highest conviction'),
  confidence_score: z.number().min(0).max(100).describe('How confident the agent is in this analysis'),
  verdict: z.enum(['INVEST', 'PASS']),
  detailed_reasoning: z.string().describe("The agent's full chain of reasoning behind the verdict"),
  sources: z.array(SourceRefSchema).default([]),
  generated_at: z.string().default(() => new Date().toISOString()),
});

export type StructuredReport = z.infer<typeof StructuredReportSchema>;
export type FinancialHealth = z.infer<typeof FinancialHealthSchema>;
export type SwotAnalysis = z.infer<typeof SwotAnalysisSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;
