import { Card, CardContent } from "@/components/ui/card";
import type { ApiUsageSummary } from "@/types";

export function ApiUsageTable({ usage }: { usage: ApiUsageSummary[] }) {
  if (usage.length === 0) {
    return <p className="text-sm text-ink-faint italic">No API activity recorded yet.</p>;
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <p className="mb-3 text-xs text-ink-faint">Real usage from persisted backend API logs for this user.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="ledger-row text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="py-3 font-medium">Provider</th>
              <th className="py-3 font-medium text-right">Calls</th>
              <th className="py-3 font-medium text-right">Success</th>
              <th className="py-3 font-medium text-right">Failed</th>
              <th className="py-3 font-medium text-right">Avg latency</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((row) => (
              <tr key={row.provider} className="ledger-row">
                <td className="py-3 text-ink">{row.provider}</td>
                <td className="data-figure py-3 text-right text-ink-muted">{row.total_calls}</td>
                <td className="data-figure py-3 text-right text-invest">{row.success_count}</td>
                <td className="data-figure py-3 text-right text-pass">{row.failure_count}</td>
                <td className="data-figure py-3 text-right text-ink-muted">
                  {row.avg_latency_ms !== null ? `${row.avg_latency_ms.toFixed(0)}ms` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
