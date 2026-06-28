import { formatDistanceToNow } from "date-fns";
import { Loader2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportSummary } from "@/types";

export function ReportCard({ report }: { report: ReportSummary }) {
  return (
    <Link to={`/report/${report.id}`}>
      <Card className="transition-colors duration-150 hover:border-border-strong">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-ink">{report.company_name}</p>
              {report.ticker && (
                <span className="data-figure text-xs text-ink-faint">{report.ticker}</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink-faint">
              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {report.status === "completed" && report.verdict && (
              <Badge variant={report.verdict === "INVEST" ? "invest" : "pass"}>
                {report.verdict}
              </Badge>
            )}
            {report.status === "completed" && report.investment_score !== null && (
              <span className="data-figure text-sm text-ink-muted">{report.investment_score}</span>
            )}
            {report.status === "running" && <Loader2 className="size-4 animate-spin text-accent" />}
            {report.status === "failed" && <XCircle className="size-4 text-pass" />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
