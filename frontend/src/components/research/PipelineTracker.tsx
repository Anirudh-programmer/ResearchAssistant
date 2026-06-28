import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { PIPELINE_STEPS } from "@/types";

interface PipelineTrackerProps {
  completedStepIds: Set<string>;
  currentStepId: string | null;
  failed?: boolean;
}

export function PipelineTracker({ completedStepIds, currentStepId, failed }: PipelineTrackerProps) {
  return (
    <ol className="space-y-3">
      {PIPELINE_STEPS.map((step, i) => {
        const isDone = completedStepIds.has(step.id);
        const isCurrent = currentStepId === step.id && !isDone;

        return (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                isDone && "border-invest bg-invest-soft text-invest",
                isCurrent && !failed && "border-accent bg-accent-soft text-accent",
                !isDone && !isCurrent && "border-border-strong text-ink-faint",
                isCurrent && failed && "border-pass bg-pass-soft text-pass",
              )}
            >
              {isDone ? (
                <Check className="size-3.5" />
              ) : isCurrent ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                isDone || isCurrent ? "text-ink font-medium" : "text-ink-faint",
              )}
            >
              {step.label}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}
