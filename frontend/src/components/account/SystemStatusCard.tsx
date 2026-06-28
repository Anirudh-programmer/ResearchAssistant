import { Check, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { SystemStatus } from "@/types";

function StatusRow({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div className="ledger-row flex items-center justify-between py-2.5 text-sm">
      <span className="capitalize text-ink-muted">{label.replace(/_/g, " ")}</span>
      {configured ? (
        <span className="flex items-center gap-1.5 text-invest">
          <Check className="size-3.5" /> Configured
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-ink-faint">
          <X className="size-3.5" /> Not configured
        </span>
      )}
    </div>
  );
}

export function SystemStatusCard({ status }: { status: SystemStatus }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="pt-4">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            LLM providers
          </h4>
          {Object.entries(status.llm_providers).map(([name, configured]) => (
            <StatusRow key={name} label={name} configured={configured} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Research tools
          </h4>
          {Object.entries(status.research_tools).map(([name, configured]) => (
            <StatusRow key={name} label={name} configured={configured} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
