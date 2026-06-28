import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompanySearchForm } from "@/components/research/CompanySearchForm";
import { PipelineTracker } from "@/components/research/PipelineTracker";
import { PopularStocksGrid } from "@/components/research/PopularStocksGrid";
import { ReportView } from "@/components/report/ReportView";
import { setFavorite, streamAnalysis } from "@/services/reportService";
import type { ReportDetail } from "@/types";

type Phase = "idle" | "running" | "completed" | "failed";

export function ResearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [companyName, setCompanyName] = useState("");
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoRunRef = useRef<string | null>(null);

  const favoriteMutation = useMutation({
    mutationFn: (isFavorite: boolean) => setFavorite(report!.id, isFavorite),
    onSuccess: (updated) => {
      setReport(updated);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["saved-companies"] });
    },
  });
  const runAnalysis = useCallback(async (name: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCompanyName(name);
    setPhase("running");
    setCompletedStepIds(new Set());
    setCurrentStepId("research_profile");
    setErrorMessage(null);
    setReport(null);

    // Invalidate immediately so the sidebar reflects the new running report item
    queryClient.invalidateQueries({ queryKey: ["reports"] });

    try {
      await streamAnalysis(
        name,
        (event) => {
          if (event.type === "step_complete") {
            setCompletedStepIds((prev) => new Set(prev).add(event.step.id));
            const steps = ["research_profile", "collect_news", "sentiment_and_risk", "llm_reasoning"];
            const idx = steps.indexOf(event.step.id);
            setCurrentStepId(steps[idx + 1] ?? null);
          } else if (event.type === "report") {
            setReport(event.report);
            setPhase("completed");
            queryClient.invalidateQueries({ queryKey: ["reports"] });
          } else if (event.type === "error") {
            setErrorMessage(event.message);
            setPhase("failed");
            queryClient.invalidateQueries({ queryKey: ["reports"] });
          }
        },
        null,
        controller.signal,
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setPhase("failed");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  }, [queryClient]);

  useEffect(() => {
    const state = location.state as { companyName?: string; autoRun?: boolean } | null;
    const requestedCompany = state?.companyName?.trim();
    if (!requestedCompany || autoRunRef.current === requestedCompany) return;

    autoRunRef.current = requestedCompany;
    if (state?.autoRun) {
      void runAnalysis(requestedCompany);
    } else {
      setCompanyName(requestedCompany);
    }
  }, [location.state, runAnalysis]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">New research</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter a company name — the agent will research, reason, and return a verdict.
        </p>
      </div>

      <CompanySearchForm key={companyName} onSubmit={runAnalysis} disabled={phase === "running"} defaultValue={companyName} />

      <AnimatePresence mode="wait">
        {phase === "running" && (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8"
          >
            <Card>
              <CardContent className="pt-6">
                <p className="mb-5 text-sm font-medium text-ink">
                  Researching <span className="data-figure">{companyName}</span>…
                </p>
                <PipelineTracker completedStepIds={completedStepIds} currentStepId={currentStepId} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "failed" && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8"
          >
            <Card className="border-pass-soft">
              <CardContent className="flex items-start gap-3 pt-6">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-pass" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">Analysis failed</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {errorMessage ?? "An unexpected error occurred."}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => runAnalysis(companyName)}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "completed" && report && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-10"
          >
            <ReportView
              report={report}
              onToggleFavorite={() => favoriteMutation.mutate(!report.is_favorite)}
              isFavoritePending={favoriteMutation.isPending}
            />
            <div className="mt-8 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/report/${report.id}`)}>
                View in history
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        <PopularStocksGrid onSelect={runAnalysis} />
      </div>
    </div>
  );
}
