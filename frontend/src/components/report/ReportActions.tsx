import { Check, Copy, Download, RefreshCw, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ReportDetail } from "@/types";

function reportToMarkdown(report: ReportDetail): string {
  const r = report.report_data;
  if (!r) return `# ${report.company_name}\n\nNo report data available.`;

  const uniqueSources = Array.from(
    new Map(r.sources.map((source) => [source.name.trim().toLowerCase(), source])).values(),
  );

  const lines: string[] = [
    `# ${r.company_name}${r.ticker ? ` (${r.ticker})` : ""}`,
    "",
    `**Verdict:** ${r.verdict}  `,
    `**Investment score:** ${r.investment_score}/100  `,
    `**Confidence:** ${r.confidence_score}/100`,
    "",
    `## Summary`,
    r.current_summary,
    "",
    `## Financial health`,
    `- Revenue trend: ${r.financial_health.revenue_trend}`,
    `- Profitability: ${r.financial_health.profitability}`,
    `- Debt analysis: ${r.financial_health.debt_analysis}`,
    "",
    `## Competitive position`,
    r.competitive_position,
    "",
    `## Positive signals`,
    ...r.positive_signals.map((s) => `- ${s}`),
    "",
    `## Negative signals`,
    ...r.negative_signals.map((s) => `- ${s}`),
    "",
    `## Major risks`,
    ...r.major_risks.map((s) => `- ${s}`),
    "",
    `## Growth opportunities`,
    ...r.growth_opportunities.map((s) => `- ${s}`),
    "",
    `## SWOT`,
    `**Strengths:** ${r.swot.strengths.join("; ")}`,
    `**Weaknesses:** ${r.swot.weaknesses.join("; ")}`,
    `**Opportunities:** ${r.swot.opportunities.join("; ")}`,
    `**Threats:** ${r.swot.threats.join("; ")}`,
    "",
    `## Detailed reasoning`,
    r.detailed_reasoning,
    "",
    `## Sources`,
    ...uniqueSources.map((s) => `- ${s.name}${s.url ? ` - ${s.url}` : ""}`),
  ];

  return lines.join("\n");
}

interface ReportActionsProps {
  report: ReportDetail;
  onToggleFavorite?: () => void;
  onRetry?: () => void;
  isFavoritePending?: boolean;
}

export function ReportActions({
  report,
  onToggleFavorite,
  onRetry,
  isFavoritePending,
}: ReportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportToMarkdown(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([reportToMarkdown(report)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.company_name.replace(/\s+/g, "-").toLowerCase()}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
        <Download className="size-4" /> Export .md
      </Button>
      {onToggleFavorite && (
        <Button variant="outline" size="sm" onClick={onToggleFavorite} disabled={isFavoritePending}>
          <Star className={report.is_favorite ? "size-4 fill-current text-accent" : "size-4"} />
          {report.is_favorite ? "Saved" : "Save"}
        </Button>
      )}
      {onRetry && report.status === "failed" && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" /> Retry
        </Button>
      )}
    </div>
  );
}
