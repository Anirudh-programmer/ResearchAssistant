import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <Card className={cn("h-28 flex flex-col justify-center bg-surface border-border", className)}>
      <CardContent className="py-2 px-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="data-figure mt-1.5 text-2xl font-bold text-ink leading-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
