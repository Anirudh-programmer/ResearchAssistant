import { AlertTriangle, Check, TrendingUp, X } from "lucide-react";

import { cn } from "@/lib/utils";

type SignalTone = "positive" | "negative" | "risk" | "opportunity";

const toneConfig: Record<SignalTone, { icon: typeof Check; className: string }> = {
  positive: { icon: Check, className: "text-positive" },
  negative: { icon: X, className: "text-negative" },
  risk: { icon: AlertTriangle, className: "text-pass" },
  opportunity: { icon: TrendingUp, className: "text-invest" },
};

interface SignalListProps {
  items: string[];
  tone: SignalTone;
  emptyLabel?: string;
}

export function SignalList({ items, tone, emptyLabel = "None identified" }: SignalListProps) {
  const { icon: Icon, className } = toneConfig[tone];

  if (items.length === 0) {
    return <p className="text-sm text-ink-faint italic">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
          <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
