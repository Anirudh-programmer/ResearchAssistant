import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
  className?: string;
}

/** Circular gauge for 0-100 scores (investment score, confidence score). */
export function ScoreGauge({ score, label, size = 96, className }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const colorClass = clamped >= 60 ? "text-invest" : clamped >= 40 ? "text-accent" : "text-pass";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-raised)"
            strokeWidth={6}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-700 ease-out", colorClass)}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="data-figure text-2xl font-semibold text-ink">{clamped}</span>
        </div>
      </div>
      <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
    </div>
  );
}
