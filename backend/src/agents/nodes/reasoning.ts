import { AgentState } from '../state';
import { buildGeminiWithModel, GEMINI_MODEL_CHAIN } from '../../llm';
import { ResearchBundle } from '../../tools/base';
import { StructuredReportSchema } from '../../types/report';
import { config } from '../../config';

const SYSTEM_PROMPT = `You are a rigorous, skeptical investment analyst at a long-only equity research desk. You are given raw research about a company gathered from multiple sources (company profile, financial metrics, recent news, web search results on sentiment and risk). Some sources may be unavailable — reason only from what is actually provided, and be explicit in your reasoning when data is missing rather than inventing numbers.

Your job:
1. Synthesize all provided research into a coherent picture of the company.
2. Identify concrete positive signals, negative signals, risks, and growth opportunities — each grounded in something from the provided research, not generic boilerplate.
3. Produce a SWOT analysis.
4. Assign an investment_score (0-100): your conviction in the investment opportunity itself.
5. Assign a confidence_score (0-100): how confident YOU are in this analysis, which should be LOWER when key data sources (financials, news) were unavailable.
6. Give a final verdict of either INVEST or PASS, with detailed, specific reasoning — not hedged platitudes. Take a real position.

Be specific. Cite concrete facts from the research in your reasoning wherever possible. If financial data was unavailable, say so explicitly and lower your confidence_score accordingly rather than guessing at numbers.`;

function buildUserPrompt(companyName: string, ticker: string | null, bundle: ResearchBundle): string {
  const parts = [
    `Company to analyze: ${companyName}`,
    `Resolved ticker: ${ticker || 'Not resolved — treat as a private/unlisted or unmatched company'}`,
    '',
    '=== RESEARCH GATHERED ===',
    bundle.toPromptContext(),
  ];

  if (bundle.unavailableTools.length > 0) {
    parts.push(
      `\n=== UNAVAILABLE SOURCES (factor into confidence_score) ===\n${bundle.unavailableTools.join(', ')}`
    );
  }

  return parts.join('\n');
}

function generateMockReport(companyName: string, ticker: string | null) {
  const symbol = ticker || companyName.substring(0, 4).toUpperCase();
  return {
    company_name: companyName,
    ticker: symbol,
    industry: 'Technology / Diversified Services',
    current_summary: `${companyName} is a global industry player demonstrating steady operational momentum. The business continues to expand its core services while integrating intelligent digital products to scale efficiency.`,
    financial_health: {
      revenue_trend: 'Positive upward trajectory over multiple quarters, indicating solid client retention.',
      profitability: 'Maintains healthy margins, though research investments suggest moderate short-term overhead.',
      debt_analysis: 'Healthy balance sheet with negligible debt risks and solid free cash flows.',
      market_cap: 'Large Cap',
      current_price: 180.25,
      pe_ratio: 26.4
    },
    competitive_position: 'Defended by high barrier to entry, network effects, and robust product ecosystem.',
    recent_news: [
      {
        title: `${companyName} launches next-gen technology roadmap`,
        summary: `The roadmap aims to optimize operational workflows and scale software integrations across enterprise users.`,
        url: 'https://example.com/news',
        published_at: new Date().toISOString(),
        sentiment: 'positive'
      }
    ],
    positive_signals: [
      'Strong year-over-year revenue expansion',
      'Solid free cash flow generation and cash reserves',
      'Growing product ecosystem adoption'
    ],
    negative_signals: [
      'Regulatory compliance shifts in primary service areas',
      'Increased research and development expenditures'
    ],
    major_risks: [
      'Supply chain dependencies in adjacent physical operations',
      'Intense pricing competition from low-margin competitors'
    ],
    growth_opportunities: [
      'Monetization of digital workflow APIs',
      'Untapped expansion opportunities in emerging geographic markets'
    ],
    swot: {
      strengths: ['Market leading position', 'Strong financial liquidity', 'High brand affinity'],
      weaknesses: ['Dependence on maturity cycles of flagship offerings', 'Moderate pricing pressure'],
      opportunities: ['Expansion of AI-driven tools', 'Strategic corporate partnerships'],
      threats: ['Macroeconomic headwinds', 'Evolving global regulatory standards']
    },
    investment_score: 85,
    confidence_score: 95,
    verdict: 'INVEST' as const,
    detailed_reasoning: `Synthesis of research gathered for ${companyName} (${symbol}) shows robust fundamental health and structural growth. Key strengths in brand value and liquidity heavily counter the mild concerns regarding operating costs. The investment case remains compelling.`,
    sources: [
      { name: 'wikipedia', url: 'https://en.wikipedia.org', type: 'wikipedia' },
      { name: 'finnhub', url: 'https://finnhub.io', type: 'financial' },
      { name: 'tavily', url: 'https://tavily.com', type: 'web_search' }
    ],
    generated_at: new Date().toISOString()
  };
}

function generateFallbackReport(companyName: string, ticker: string | null, bundle: ResearchBundle, errorMsg: string) {
  const symbol = ticker || companyName.substring(0, 4).toUpperCase();
  
  let marketCap = 'N/A';
  let currentPrice: number | undefined = undefined;
  let peRatio: number | undefined = undefined;
  
  const finnhubResult = bundle.availableResults.find(r => r.toolName === 'finnhub');
  if (finnhubResult && typeof finnhubResult.data === 'string') {
    const lines = finnhubResult.data.split('\n');
    for (const line of lines) {
      if (line.includes('Market Cap:')) {
        marketCap = line.split(':')[1]?.trim() || 'N/A';
      }
      if (line.includes('Current Price:')) {
        const val = parseFloat(line.split(':')[1]?.trim() || '');
        if (!isNaN(val)) currentPrice = val;
      }
      if (line.includes('P/E Ratio:')) {
        const val = parseFloat(line.split(':')[1]?.trim() || '');
        if (!isNaN(val)) peRatio = val;
      }
    }
  }

  const recentNews: any[] = [];
  const newsApiResult = bundle.availableResults.find(r => r.toolName === 'news_api');
  const finnhubNewsResult = bundle.availableResults.find(r => r.toolName === 'finnhub_news');
  
  if (finnhubNewsResult && typeof finnhubNewsResult.data === 'string') {
    const lines = finnhubNewsResult.data.split('\n');
    for (const line of lines) {
      if (line.startsWith('- ')) {
        recentNews.push({
          title: line.substring(2).trim(),
          summary: 'Retrieved headline from Finnhub News.',
          sentiment: 'neutral'
        });
      }
    }
  } else if (newsApiResult && typeof newsApiResult.data === 'string') {
    const lines = newsApiResult.data.split('\n');
    for (const line of lines) {
      if (line.startsWith('- ')) {
        recentNews.push({
          title: line.substring(2).trim(),
          summary: 'Retrieved headline from News API.',
          sentiment: 'neutral'
        });
      }
    }
  }

  if (recentNews.length === 0) {
    recentNews.push({
      title: `News search for ${companyName}`,
      summary: 'No individual headlines could be parsed, check Tavily search sources.',
      sentiment: 'neutral'
    });
  }

  const wikiResult = bundle.availableResults.find(r => r.toolName === 'wikipedia');
  const wikiText = wikiResult && typeof wikiResult.data === 'string' ? wikiResult.data : '';
  const currentSummary = wikiText 
    ? wikiText.substring(0, 300) + '...'
    : `${companyName} overview compiled from active search endpoints.`;

  return {
    company_name: companyName,
    ticker: symbol,
    industry: 'Technology / Software',
    is_fallback: true,
    current_summary: currentSummary,
    financial_health: {
      revenue_trend: 'Revenue metrics gathered. Enable Gemini billing for AI synthesis.',
      profitability: 'Margin indicators retrieved. Enable Gemini billing for AI synthesis.',
      debt_analysis: 'Leverage profiles retrieved. Enable Gemini billing for AI synthesis.',
      market_cap: marketCap,
      current_price: currentPrice,
      pe_ratio: peRatio
    },
    competitive_position: 'Competitive position indicators collected. Enable Gemini billing for AI synthesis.',
    recent_news: recentNews.slice(0, 5),
    positive_signals: [
      'Successfully resolved stock ticker and retrieved real-time financial profile.',
      'Active news and media updates compiled successfully.',
      'Wikipedia summary and references resolved.'
    ],
    negative_signals: [
      'Gemini API reasoning unavailable due to quota / rate limits.',
      'Using automatic rules-based parser fallback for metric organization.'
    ],
    major_risks: [
      'Slightly lower report confidence because qualitative sentiment extraction was bypassed.',
      'Advanced predictive analysis skipped.'
    ],
    growth_opportunities: [
      'Configure billing in your Google AI Studio dashboard to upgrade your API limit.',
      'Or enable MOCK_LLM=true in your .env file to generate simulated mock reasoning during testing.'
    ],
    swot: {
      strengths: ['Real-time search results compiled', 'Live ticker resolution'],
      weaknesses: ['Skipped AI evaluation node (429 rate limit exceeded)'],
      opportunities: ['Gemini billing activation'],
      threats: ['Lack of customized risk synthesis']
    },
    investment_score: 50,
    confidence_score: 25,
    verdict: 'PASS' as const,
    detailed_reasoning: `⚠️ WARNING: Quota Exceeded (429 Too Many Requests).\n\nThis report was generated in offline fallback mode because your Gemini API key has exceeded its free tier token count limits (Error: ${errorMsg}).\n\nTo restore full AI-powered reasoning, please do one of the following:\n1. Transition to pay-as-you-go billing in Google AI Studio to unlock higher rate limits.\n2. Enable MOCK_LLM=true in backend/.env to mock successful reasoning during development.`,
    sources: bundle.availableResults.map(r => ({
      name: r.toolName,
      url: r.sourceUrl || undefined,
      type: r.toolName === 'wikipedia' ? 'wikipedia' : r.toolName === 'finnhub' ? 'financial' : 'web_search'
    })),
    generated_at: new Date().toISOString()
  };
}

export async function reasoningNode(state: AgentState): Promise<Partial<AgentState>> {
  const companyName = state.companyName;
  const ticker = state.ticker;
  const rawResults = state.toolResults || [];

  const bundle = new ResearchBundle(companyName);
  for (const r of rawResults) {
    bundle.add(r);
  }

  // Handle mock mode
  if (config.MOCK_LLM) {
    console.log(`[ReasoningNode] Mock mode active. Generating realistic report for ${companyName}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const mockReport = generateMockReport(companyName, ticker);
    return {
      structuredReport: mockReport,
      currentStep: 'completed',
      completedSteps: ['llm_reasoning', 'final_recommendation'],
      llmProviderOverride: 'mock',
    };
  }

  const userPrompt = buildUserPrompt(companyName, ticker, bundle);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  // Try each Gemini model in the fallback chain (each has separate free-tier quotas)
  const errors: string[] = [];
  
  for (const modelName of GEMINI_MODEL_CHAIN) {
    try {
      console.log(`[ReasoningNode] Trying model: ${modelName}`);
      const provider = buildGeminiWithModel(modelName);
      const structuredModel = provider.withStructuredOutput(StructuredReportSchema);
      const report = await structuredModel.invoke(messages);

      // Ensure companyName and ticker match resolved values
      report.company_name = companyName;
      report.ticker = ticker || report.ticker;

      console.log(`[ReasoningNode] ✅ Success with model: ${modelName}`);
      return {
        structuredReport: report,
        currentStep: 'completed',
        completedSteps: ['llm_reasoning', 'final_recommendation'],
        llmProviderOverride: `gemini:${modelName}`,
      };
    } catch (error: any) {
      const errMsg = error.message || String(error);
      const is429 = errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('quota');
      errors.push(`${modelName}: ${errMsg.substring(0, 120)}`);
      
      console.warn(`[ReasoningNode] ❌ ${modelName} failed${is429 ? ' (quota exceeded)' : ''}: ${errMsg.substring(0, 100)}`);
      
      if (is429) {
        // Extract retry delay from error if available, otherwise default to 5s
        const retryMatch = errMsg.match(/retry in (\d+(?:\.\d+)?)/i);
        const waitMs = retryMatch ? Math.min(parseFloat(retryMatch[1]) * 1000, 15000) : 5000;
        console.log(`[ReasoningNode] Waiting ${Math.round(waitMs / 1000)}s before trying next model...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue; // try next model
      }
      
      // Non-quota error — still try next model
      continue;
    }
  }

  // All models exhausted — generate fallback report
  const combinedErrors = errors.join(' | ');
  console.error(`[ReasoningNode] All ${GEMINI_MODEL_CHAIN.length} models exhausted. Generating fallback report.`);
  console.error(`[ReasoningNode] Errors: ${combinedErrors}`);
  
  const fallbackReport = generateFallbackReport(companyName, ticker, bundle, combinedErrors);
  return {
    structuredReport: fallbackReport,
    currentStep: 'completed',
    completedSteps: ['llm_reasoning', 'final_recommendation'],
    llmProviderOverride: 'fallback',
  };
}
