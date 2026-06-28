import { Check, Star, Code, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const phases = [
  {
    name: "Phase 1: Advanced AI Reasoning",
    icon: Star,
    description: "Expanding cognitive capability and accuracy",
    features: [
      "Consensus analysis (Gemini, Claude, GPT cross-evaluation)",
      "Real-time watchlist change notifications & alerts",
      "Dynamic SWOT analysis updates based on daily market events",
    ],
    status: "In Development",
    highlighted: false,
  },
  {
    name: "Phase 2: Terminal Integrations",
    icon: Code,
    description: "Connecting deeper live financial datasets",
    features: [
      "Real-time NewsAPI stream integration (with custom sentiment tags)",
      "Interactive financial indicators and charts (Vantage / Finnhub)",
      "PDF report generation and email digest delivery",
    ],
    status: "Upcoming Target",
    highlighted: true,
  },
  {
    name: "Phase 3: Fund & Team Workspaces",
    icon: Users,
    description: "Built for collaborative investment research",
    features: [
      "Shared portfolios & custom notes among team members",
      "Role-based access controls and action audit logs",
      "Custom system prompts & analyst constraints per fund",
    ],
    status: "Long-term Scope",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-20 md:py-28">
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Future Scope
          </span>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            Product Roadmap
          </h2>
          <p className="mt-3 text-ink-muted">
            Verdict is evolving. Here is a preview of the upcoming capabilities and integration phases currently in our scope.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {phases.map((phase) => {
            const IconComponent = phase.icon;
            return (
              <Card
                key={phase.name}
                className={phase.highlighted ? "border-2 border-accent bg-surface-raised" : "bg-surface/60 border-border"}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-accent-soft/30 text-accent">
                      <IconComponent className="size-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                      {phase.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-ink">{phase.name}</h3>
                  <p className="mt-2 text-xs text-ink-muted leading-relaxed">{phase.description}</p>

                  <div className="my-5 border-t border-border/60" />

                  <ul className="space-y-3">
                    {phase.features.map((f) => (
                      <li key={f} className="flex gap-2 text-xs text-ink-muted leading-relaxed">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
