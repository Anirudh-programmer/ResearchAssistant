import { useQuery } from "@tanstack/react-query";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPopularStocks } from "@/services/reportService";
import type { PopularStock } from "@/types";

function formatCurrency(value: number | null) {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatCompactCurrency(value: number | null) {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatPe(value: number | null) {
  if (value === null) return "N/A";
  return value.toFixed(1);
}

function PopularStockBox({ stock, onSelect }: { stock: PopularStock; onSelect?: (companyName: string) => void }) {
  const positive = (stock.changePercent ?? 0) >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <button
      type="button"
      className="min-h-30 rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-raised focus-visible:outline-accent"
      onClick={() => onSelect?.(stock.name)}
      aria-label={`Use ${stock.name} for research`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{stock.name}</p>
          <p className="data-figure mt-0.5 text-xs text-ink-faint">{stock.symbol}</p>
        </div>
        <span
          className={cn(
            "data-figure inline-flex items-center gap-1 text-xs font-semibold",
            positive ? "text-positive" : "text-negative",
          )}
        >
          <Icon className="size-3" />
          {formatPercent(stock.changePercent)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span className="text-ink-muted">Price</span>
        <span className="data-figure text-right font-medium text-ink">{formatCurrency(stock.price)}</span>
        <span className="text-ink-muted">Valuation</span>
        <span className="data-figure text-right font-medium text-ink">P/E {formatPe(stock.peRatio)}</span>
        <span className="text-ink-muted">Market cap</span>
        <span className="data-figure text-right font-medium text-ink">{formatCompactCurrency(stock.marketCap)}</span>
      </div>
    </button>
  );
}

function PopularStockSkeleton() {
  return (
    <div className="min-h-30 rounded-md border border-border bg-surface p-3">
      <div className="h-4 w-24 rounded bg-surface-raised" />
      <div className="mt-2 h-3 w-12 rounded bg-surface-raised" />
      <div className="mt-5 space-y-2">
        <div className="h-3 rounded bg-surface-raised" />
        <div className="h-3 rounded bg-surface-raised" />
        <div className="h-3 rounded bg-surface-raised" />
      </div>
    </div>
  );
}

export function PopularStocksGrid({ onSelect }: { onSelect?: (companyName: string) => void }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["popular-stocks"],
    queryFn: getPopularStocks,
    staleTime: 60_000,
    retry: 1,
  });

  if (isError) {
    return (
      <div className="mt-5 rounded-md border border-border bg-surface p-4 text-sm text-ink-muted">
        <div className="flex items-center gap-2 font-medium text-ink">
          <AlertCircle className="size-4 text-pass" />
          Live market data unavailable
        </div>
        <p className="mt-1">
          {(error as Error)?.message || "Configure Finnhub to show live quote boxes here."}
        </p>
      </div>
    );
  }

  const stocks = data?.items ?? [];

  return (
    <section className="mt-5" aria-label="Popular stocks with live market data">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Popular stocks</h2>
          <p className="mt-1 text-xs text-ink-muted">Live quote, valuation, and market cap for widely followed companies.</p>
        </div>
        {data?.generated_at && (
          <p className="data-figure text-xs text-ink-faint">
            Updated {new Date(data.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 12 }, (_, index) => <PopularStockSkeleton key={index} />)
          : stocks.slice(0, 12).map((stock) => <PopularStockBox key={stock.symbol} stock={stock} onSelect={onSelect} />)}
      </div>
    </section>
  );
}