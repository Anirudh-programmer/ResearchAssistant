import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportView } from "@/components/report/ReportView";
import { deleteReport, getReport, retryAnalysis, setFavorite } from "@/services/reportService";

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => getReport(reportId!),
    enabled: !!reportId,
    refetchInterval: (query) =>
      query.state.data?.status === "running" || query.state.data?.status === "pending" ? 2000 : false,
  });

  const favoriteMutation = useMutation({
    mutationFn: (isFavorite: boolean) => setFavorite(reportId!, isFavorite),
    onSuccess: (updated) => {
      queryClient.setQueryData(["report", reportId], updated);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["saved-companies"] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryAnalysis(reportId!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["report", reportId], updated);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["saved-companies"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteReport(reportId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["saved-companies"] });
      navigate("/history");
    },
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="w-full">
        <Card className="border-pass-soft">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="size-5 text-pass" />
            <p className="text-sm text-ink">This report doesn't exist or couldn't be loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      {(report.status === "pending" || report.status === "running") && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Loader2 className="size-5 animate-spin text-accent" />
            <p className="text-sm text-ink">
              Analysis for <span className="data-figure">{report.company_name}</span> is still running…
            </p>
          </CardContent>
        </Card>
      )}

      {report.status === "failed" && (
        <Card className="border-pass-soft">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-pass" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Analysis failed</p>
              <p className="mt-1 text-sm text-ink-muted">
                {report.error_message ?? "An unexpected error occurred."}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending}>
                  {retryMutation.isPending ? "Retrying…" : "Retry"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {report.status === "completed" && (
        <>
          <ReportView
            report={report}
            onToggleFavorite={() => favoriteMutation.mutate(!report.is_favorite)}
            isFavoritePending={favoriteMutation.isPending}
          />
          <div className="mt-10 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              <Trash2 className="size-4" /> Delete report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
