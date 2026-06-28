import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, History as HistoryIcon, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ReportCard } from "@/components/dashboard/ReportCard";
import { ReportListSkeleton } from "@/components/dashboard/ReportListSkeleton";
import { getReports } from "@/services/reportService";

const PAGE_SIZE = 15;

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", { page, pageSize: PAGE_SIZE }],
    queryFn: () => getReports(page, PAGE_SIZE),
  });

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.items;
    const q = search.trim().toLowerCase();
    return data.items.filter(
      (r) => r.company_name.toLowerCase().includes(q) || r.ticker?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">History</h1>
        <p className="mt-1 text-sm text-ink-muted">Every analysis you've run, searchable.</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <Input
          placeholder="Filter by company or ticker"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && <ReportListSkeleton count={6} />}

      {!isLoading && filteredItems.length === 0 && (
        <EmptyState
          icon={HistoryIcon}
          title={search ? "No matching reports" : "No reports yet"}
          description={
            search
              ? "Try a different company name or ticker."
              : "Your completed and in-progress analyses will show up here."
          }
        />
      )}

      {!isLoading && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {!isLoading && !search && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="data-figure text-sm text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
