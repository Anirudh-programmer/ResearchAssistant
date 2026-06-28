import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/middleware';
import { config } from '../config';

interface PopularStockSeed {
  symbol: string;
  name: string;
}

const popularStocks: PopularStockSeed[] = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'NVDA', name: 'Nvidia' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'AVGO', name: 'Broadcom' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'LLY', name: 'Eli Lilly' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'NFLX', name: 'Netflix' },
];

const router = Router();

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatMarketCap(marketCapMillions: number | null): number | null {
  return marketCapMillions === null ? null : marketCapMillions * 1_000_000;
}

router.get('/market/popular', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  if (!config.FINNHUB_API_KEY) {
    return res.status(503).json({ message: 'FINNHUB_API_KEY is not configured.' });
  }

  const token = config.FINNHUB_API_KEY;

  const items = await Promise.all(
    popularStocks.map(async (stock) => {
      try {
        const query = new URLSearchParams({ symbol: stock.symbol, token });
        const metricQuery = new URLSearchParams({ symbol: stock.symbol, metric: 'all', token });

        const [profileRes, quoteRes, metricsRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/stock/profile2?${query.toString()}`),
          fetch(`https://finnhub.io/api/v1/quote?${query.toString()}`),
          fetch(`https://finnhub.io/api/v1/stock/metric?${metricQuery.toString()}`),
        ]);

        if (!quoteRes.ok) {
          throw new Error(`Quote request failed for ${stock.symbol}`);
        }

        const [profile, quote, metrics] = await Promise.all<any>([
          profileRes.ok ? profileRes.json() : Promise.resolve({}),
          quoteRes.json(),
          metricsRes.ok ? metricsRes.json() : Promise.resolve({}),
        ]);

        const metric = metrics.metric || {};

        return {
          symbol: stock.symbol,
          name: profile.name || stock.name,
          price: toNumber(quote.c),
          change: toNumber(quote.d),
          changePercent: toNumber(quote.dp),
          previousClose: toNumber(quote.pc),
          marketCap: formatMarketCap(toNumber(profile.marketCapitalization)),
          peRatio: toNumber(metric.peTTM),
          source: 'finnhub',
        };
      } catch (error: any) {
        return {
          symbol: stock.symbol,
          name: stock.name,
          price: null,
          change: null,
          changePercent: null,
          previousClose: null,
          marketCap: null,
          peRatio: null,
          source: 'finnhub',
          error: error.message || 'Quote unavailable',
        };
      }
    }),
  );

  return res.json({ items, generated_at: new Date().toISOString() });
});

export default router;