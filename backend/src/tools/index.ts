import { config } from '../config';
import { ToolResult, ToolResultHelper } from './base';

/**
 * Resolves a company name to a stock ticker symbol via Finnhub search.
 */
export async function resolveTicker(companyName: string): Promise<ToolResult> {
  if (!config.FINNHUB_API_KEY) {
    return ToolResultHelper.unavailable('ticker_resolver', 'FINNHUB_API_KEY not configured');
  }

  try {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(companyName)}&token=${config.FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Finnhub error: ${response.statusText}`);
    }
    const data = (await response.json()) as any;
    const matches = data.result || [];
    
    // Prefer common stock listings
    const common = matches.filter((m: any) => m.type === 'Common Stock');
    const best = common[0] || matches[0];

    if (!best) {
      return ToolResultHelper.unavailable('ticker_resolver', `No ticker found for '${companyName}'`);
    }

    return ToolResultHelper.ok('ticker_resolver', best.symbol);
  } catch (error: any) {
    return ToolResultHelper.unavailable('ticker_resolver', `Lookup failed: ${error.message || error}`);
  }
}

/**
 * Fetches summary from Wikipedia Rest API. No API key required.
 */
export async function fetchWikipediaSummary(companyName: string): Promise<ToolResult> {
  try {
    // 1. Search for page title
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(companyName)}&limit=1&namespace=0&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.statusText}`);
    }
    const searchResult = (await searchResponse.json()) as any;
    
    const titles = searchResult[1] || [];
    const urls = searchResult[3] || [];
    const bestTitle = titles[0];
    const pageUrl = urls[0] || null;

    if (!bestTitle) {
      return ToolResultHelper.unavailable('wikipedia', `No Wikipedia page found for '${companyName}'`);
    }

    // 2. Get Rest API summary for page
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) {
      throw new Error(`Summary request failed: ${summaryResponse.statusText}`);
    }
    const summaryResult = (await summaryResponse.json()) as any;
    const extract = summaryResult.extract || '';

    if (!extract) {
      return ToolResultHelper.unavailable('wikipedia', `Wikipedia page for '${bestTitle}' has no summary extract`);
    }

    return ToolResultHelper.ok('wikipedia', extract, pageUrl);
  } catch (error: any) {
    return ToolResultHelper.unavailable('wikipedia', `Lookup failed: ${error.message || error}`);
  }
}

/**
 * Fetches company profile, quotes, and basic financials from Finnhub.
 */
export async function fetchFinnhubProfile(ticker: string): Promise<ToolResult> {
  if (!config.FINNHUB_API_KEY) {
    return ToolResultHelper.unavailable('finnhub', 'FINNHUB_API_KEY not configured');
  }
  if (!ticker) {
    return ToolResultHelper.unavailable('finnhub', 'No ticker symbol resolved for this company');
  }

  try {
    const token = config.FINNHUB_API_KEY;
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${token}`;
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${token}`;
    const metricsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${token}`;

    const [profileRes, quoteRes, metricsRes] = await Promise.all([
      fetch(profileUrl).then(res => res.json() as any),
      fetch(quoteUrl).then(res => res.json() as any),
      fetch(metricsUrl).then(res => res.json() as any),
    ]);

    if (!profileRes && !quoteRes) {
      return ToolResultHelper.unavailable('finnhub', `No data found for ticker '${ticker}'`);
    }

    const metric = metricsRes.metric || {};

    const summaryLines = [
      `Company: ${profileRes.name || 'N/A'}`,
      `Industry: ${profileRes.finnhubIndustry || 'N/A'}`,
      `Market Cap: ${profileRes.marketCapitalization || 'N/A'} (million USD)`,
      `Current Price: ${quoteRes.c || 'N/A'}`,
      `Previous Close: ${quoteRes.pc || 'N/A'}`,
      `52-Week High: ${metric['52WeekHigh'] || 'N/A'}`,
      `52-Week Low: ${metric['52WeekLow'] || 'N/A'}`,
      `P/E Ratio (TTM): ${metric.peTTM || 'N/A'}`,
      `Debt-to-Equity: ${metric['totalDebt/totalEquityQuarterly'] || 'N/A'}`,
      `Revenue Growth (YoY): ${metric.revenueGrowthTTMYoy || 'N/A'}`,
      `Net Margin (TTM): ${metric.netProfitMarginTTM || 'N/A'}`,
    ];

    return ToolResultHelper.ok('finnhub', summaryLines.join('\n'));
  } catch (error: any) {
    return ToolResultHelper.unavailable('finnhub', `Request failed: ${error.message || error}`);
  }
}

/**
 * Fetches recent news articles from Finnhub.
 */
export async function fetchFinnhubNews(ticker: string): Promise<ToolResult> {
  if (!config.FINNHUB_API_KEY) {
    return ToolResultHelper.unavailable('finnhub_news', 'FINNHUB_API_KEY not configured');
  }
  if (!ticker) {
    return ToolResultHelper.unavailable('finnhub_news', 'No ticker symbol resolved for this company');
  }

  try {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);

    const fromDate = monthAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${config.FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Finnhub news error: ${response.statusText}`);
    }
    const news = (await response.json()) as any[];

    if (!news || news.length === 0) {
      return ToolResultHelper.unavailable('finnhub_news', 'No recent news found');
    }

    const formatted = news
      .slice(0, 3)
      .map(n => `- [${new Date(n.datetime * 1000).toISOString().split('T')[0]}] ${n.headline}: ${n.summary.substring(0, 150)}`)
      .join('\n');

    return ToolResultHelper.ok('finnhub_news', formatted);
  } catch (error: any) {
    return ToolResultHelper.unavailable('finnhub_news', `Request failed: ${error.message || error}`);
  }
}

/**
 * Fetches news from NewsAPI.
 */
export async function fetchNewsApi(companyName: string): Promise<ToolResult> {
  if (!config.NEWS_API_KEY) {
    return ToolResultHelper.unavailable('news_api', 'NEWS_API_KEY not configured');
  }

  try {
    const params = new URLSearchParams({
      q: companyName,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: '3',
      apiKey: config.NEWS_API_KEY,
    });
    const url = `https://newsapi.org/v2/everything?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.statusText}`);
    }
    const data = (await response.json()) as any;
    const articles = data.articles || [];

    if (articles.length === 0) {
      return ToolResultHelper.unavailable('news_api', 'No articles found');
    }

    const formatted = articles
      .map((a: any) => `- [${a.publishedAt.substring(0, 10)}] ${a.title} (${a.source?.name || 'N/A'})\n  ${a.description || ''}`)
      .join('\n');

    return ToolResultHelper.ok('news_api', formatted);
  } catch (error: any) {
    return ToolResultHelper.unavailable('news_api', `Request failed: ${error.message || error}`);
  }
}

/**
 * Performs a search via Tavily.
 */
export async function searchTavily(query: string): Promise<ToolResult> {
  if (!config.TAVILY_API_KEY) {
    return ToolResultHelper.unavailable('tavily', 'TAVILY_API_KEY not configured');
  }

  try {
    const url = 'https://api.tavily.com/search';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.TAVILY_API_KEY,
        query: query,
        max_results: 3,
        search_depth: 'advanced',
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const results = data.results || [];

    if (results.length === 0) {
      return ToolResultHelper.unavailable('tavily', 'No results returned');
    }

    const formatted = results
      .map((r: any) => `- ${r.title}: ${r.content.substring(0, 180)}`)
      .join('\n');

    return ToolResultHelper.ok('tavily', formatted);
  } catch (error: any) {
    return ToolResultHelper.unavailable('tavily', `Request failed: ${error.message || error}`);
  }
}
export type ToolFunction = (arg: string) => Promise<ToolResult>;
