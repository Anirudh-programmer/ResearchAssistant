import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FinancialHealthCard } from "@/components/report/FinancialHealthCard";
import { NewsList } from "@/components/report/NewsList";
import { ReportActions } from "@/components/report/ReportActions";
import { ScoreGauge } from "@/components/report/ScoreGauge";
import { SignalList } from "@/components/report/SignalList";
import { SwotGrid } from "@/components/report/SwotGrid";
import { VerdictStamp } from "@/components/report/VerdictStamp";
import type { ReportDetail } from "@/types";

interface ReportViewProps {
  report: ReportDetail;
  onToggleFavorite?: () => void;
  onRetry?: () => void;
  isFavoritePending?: boolean;
}

export function ReportView({ report, onToggleFavorite, onRetry, isFavoritePending }: ReportViewProps) {
  const r = report.report_data;
  if (!r) return null;

  const uniqueSources = Array.from(
    new Map(r.sources.map((source) => [source.name.trim().toLowerCase(), source])).values(),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {r.is_fallback && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-amber-500 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1 text-sm">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                Gemini API Quota Exceeded (Fallback Mode)
              </h4>
              <p className="leading-relaxed text-amber-600/80 dark:text-amber-400/80">
                This report was synthesized using real-time search data (Wikipedia, Finnhub, Tavily) because your Google Generative AI key exceeded its free tier token count limits. To restore full AI-powered reasoning, please configure billing in your Google AI Studio dashboard or enable Mock Mode in your backend settings.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="data-figure flex items-center gap-2 text-sm text-ink-faint">
            {r.ticker && <span>{r.ticker}</span>}
            {r.ticker && r.industry && <span>·</span>}
            {r.industry && <span>{r.industry}</span>}
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            {r.company_name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">{r.current_summary}</p>
        </div>
        <VerdictStamp verdict={r.verdict} size="lg" />
      </div>

      <ReportActions
        report={report}
        onToggleFavorite={onToggleFavorite}
        onRetry={onRetry}
        isFavoritePending={isFavoritePending}
      />

      <Separator />

      <div className="flex flex-wrap gap-10">
        <ScoreGauge score={r.investment_score} label="Investment score" />
        <ScoreGauge score={r.confidence_score} label="Confidence" />
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Financial health</h2>
          <FinancialHealthCard data={r.financial_health} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Competitive position</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{r.competitive_position}</p>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-ink">Growth opportunities</h2>
          <SignalList items={r.growth_opportunities} tone="opportunity" />
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Positive signals</h2>
          <SignalList items={r.positive_signals} tone="positive" />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Negative signals</h2>
          <SignalList items={r.negative_signals} tone="negative" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Major risks</h2>
        <SignalList items={r.major_risks} tone="risk" />
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">SWOT analysis</h2>
        <SwotGrid swot={r.swot} />
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Recent news</h2>
        <NewsList items={r.recent_news} />
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Detailed reasoning</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
          {r.detailed_reasoning}
        </p>
      </div>

      {uniqueSources.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Sources used</h2>
            <div className="flex flex-wrap gap-2">
              {uniqueSources.map((s, i) => (
                <Badge key={i} variant="outline">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
