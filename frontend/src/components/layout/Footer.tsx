import { Stamp } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="flex w-full flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12 lg:px-16 xl:px-24">
        <div className="flex items-center gap-2">
          <Stamp className="size-4 text-accent" />
          <span className="font-display text-sm font-semibold tracking-tight">Verdict</span>
          <span className="text-xs text-ink-faint">— AI investment research agent</span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-faint">
          <span>© {new Date().getFullYear()} Verdict. For research purposes only — not financial advice.</span>
        </div>
      </div>
    </footer>
  );
}
