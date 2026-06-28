import { useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { getReports } from "@/services/reportService";

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", { page: 1, pageSize: 100 }],
    queryFn: () => getReports(1, 100),
  });

  const reports = data?.items ?? [];
  const investCount = reports.filter((r) => r.verdict === "INVEST").length;
  const passCount = reports.filter((r) => r.verdict === "PASS").length;

  // 1. Verdict Breakdown Data
  const verdictData = [
    { name: "INVEST", value: investCount, color: "var(--color-invest)" },
    { name: "PASS", value: passCount, color: "var(--color-pass)" },
  ].filter((d) => d.value > 0);

  // 2. Score Distribution (0-40, 41-60, 61-80, 81-100)
  const ranges = [
    { name: "0-40 (Low)", count: 0 },
    { name: "41-60 (Mid)", count: 0 },
    { name: "61-80 (High)", count: 0 },
    { name: "81-100 (Strong)", count: 0 },
  ];
  reports.forEach((r) => {
    if (r.investment_score !== null && r.status === "completed") {
      if (r.investment_score <= 40) ranges[0].count++;
      else if (r.investment_score <= 60) ranges[1].count++;
      else if (r.investment_score <= 80) ranges[2].count++;
      else ranges[3].count++;
    }
  });

  // 3. Score Trends (sorted by created_at ascending)
  const trendData = [...reports]
    .filter((r) => r.investment_score !== null && r.status === "completed")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((r) => ({
      name: r.ticker || r.company_name.substring(0, 4).toUpperCase(),
      Score: r.investment_score,
      Confidence: r.confidence_score,
    }))
    .slice(-10); // Show last 10 runs

  // 4. Scatter Plot Data (Investment vs. Confidence)
  const scatterData = reports
    .filter((r) => r.investment_score !== null && r.confidence_score !== null && r.status === "completed")
    .map((r) => ({
      x: r.investment_score,
      y: r.confidence_score,
      z: 10,
      name: r.company_name,
    }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">Portfolio and research analytics at a glance.</p>
        </div>
        <Button variant="accent" asChild>
          <Link to="/research">
            <Plus className="size-4" /> New research
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total reports" value={data?.total ?? 0} />
        <StatCard label="Invest verdicts" value={investCount} />
        <StatCard label="Pass verdicts" value={passCount} />
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-ink-muted">Loading analytics...</p>
        </div>
      ) : isError || reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="size-8 text-ink-faint mb-3" />
            <p className="text-sm font-medium text-ink">No analytics available yet</p>
            <p className="mt-1 text-xs text-ink-faint">
              Analyze companies in the research tab to populate the charts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          {/* Chart 1: Verdict Ratio */}
          <Card className="bg-surface border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink">Verdict Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verdictData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {verdictData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface-raised)",
                      borderColor: "var(--color-border)",
                      borderRadius: "var(--radius-card)",
                      color: "var(--color-ink)",
                    }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Score Distribution */}
          <Card className="bg-surface border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-ink-faint)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-ink-faint)" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface-raised)",
                      borderColor: "var(--color-border)",
                      borderRadius: "var(--radius-card)",
                      color: "var(--color-ink)",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Companies" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Score Trends */}
          <Card className="bg-surface border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink">Recent Analysis Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-ink-faint)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-ink-faint)" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface-raised)",
                      borderColor: "var(--color-border)",
                      borderRadius: "var(--radius-card)",
                      color: "var(--color-ink)",
                    }}
                  />
                  <Legend iconType="plainline" />
                  <Line type="monotone" dataKey="Score" stroke="var(--color-accent)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: "var(--color-accent)" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Confidence" stroke="var(--color-ink-muted)" strokeDasharray="4 4" strokeWidth={1.5} dot={{ r: 3, strokeWidth: 0, fill: "var(--color-ink-muted)" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Investment vs Confidence */}
          <Card className="bg-surface border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink">Conviction vs. Confidence Map</CardTitle>
            </CardHeader>
            <CardContent className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" dataKey="x" name="Investment Score" stroke="var(--color-ink-faint)" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <YAxis type="number" dataKey="y" name="Confidence Score" stroke="var(--color-ink-faint)" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3", stroke: "var(--color-border)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-surface-raised p-2 text-xs text-ink shadow-md">
                            <p className="font-semibold">{data.name}</p>
                            <p className="mt-1">Investment Score: <span className="font-mono">{data.x}</span></p>
                            <p>Confidence Score: <span className="font-mono">{data.y}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Companies" data={scatterData} fill="var(--color-positive)" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
