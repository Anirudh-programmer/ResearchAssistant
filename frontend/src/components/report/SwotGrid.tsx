import { Card, CardContent } from "@/components/ui/card";
import { SignalList } from "@/components/report/SignalList";
import type { SwotAnalysis } from "@/types";

export function SwotGrid({ swot }: { swot: SwotAnalysis }) {
  const quadrants: { title: string; items: string[]; tone: "positive" | "negative" | "opportunity" | "risk" }[] = [
    { title: "Strengths", items: swot.strengths, tone: "positive" },
    { title: "Weaknesses", items: swot.weaknesses, tone: "negative" },
    { title: "Opportunities", items: swot.opportunities, tone: "opportunity" },
    { title: "Threats", items: swot.threats, tone: "risk" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {quadrants.map((q) => (
        <Card key={q.title}>
          <CardContent className="pt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {q.title}
            </h4>
            <SignalList items={q.items} tone={q.tone} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
