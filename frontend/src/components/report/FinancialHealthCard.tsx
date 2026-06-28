import { Card, CardContent } from "@/components/ui/card";
import type { FinancialHealth } from "@/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ledger-row flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="data-figure text-right text-sm text-ink">{value}</span>
    </div>
  );
}

export function FinancialHealthCard({ data }: { data: FinancialHealth }) {
  return (
    <Card>
      <CardContent className="pt-4">
        {data.current_price != null && (
          <Row label="Current price" value={`$${data.current_price.toLocaleString()}`} />
        )}
        {data.market_cap && <Row label="Market cap" value={data.market_cap} />}
        {data.pe_ratio != null && <Row label="P/E ratio" value={data.pe_ratio.toFixed(1)} />}

        <div className="mt-3 space-y-4 pt-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Revenue trend
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{data.revenue_trend}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Profitability
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{data.profitability}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Debt analysis
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{data.debt_analysis}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
