import { API_BASE_URL, apiFetch, getCurrentAuthToken } from "@/services/api";
import type { PaginatedReports, PipelineStep, PopularStocksResponse, ReportDetail, StructuredReport } from "@/types";

export interface AnalyzeRequest {
  company_name: string;
  llm_provider?: string | null;
}

export async function analyzeCompany(payload: AnalyzeRequest): Promise<ReportDetail> {
  return apiFetch<ReportDetail>("/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function retryAnalysis(reportId: string): Promise<ReportDetail> {
  return apiFetch<ReportDetail>(`/analyze/${reportId}/retry`, { method: "POST" });
}

export async function getReports(page = 1, pageSize = 20): Promise<PaginatedReports> {
  return apiFetch<PaginatedReports>(`/reports?page=${page}&page_size=${pageSize}`);
}

export async function getReport(reportId: string): Promise<ReportDetail> {
  return apiFetch<ReportDetail>(`/report/${reportId}`);
}

export async function deleteReport(reportId: string): Promise<void> {
  return apiFetch<void>(`/report/${reportId}`, { method: "DELETE" });
}

export async function getPopularStocks(): Promise<PopularStocksResponse> {
  return apiFetch<PopularStocksResponse>("/market/popular");
}
export async function setFavorite(reportId: string, isFavorite: boolean): Promise<ReportDetail> {
  return apiFetch<ReportDetail>("/favorite", {
    method: "POST",
    body: JSON.stringify({ report_id: reportId, is_favorite: isFavorite }),
  });
}

/** SSE event shapes emitted by /analyze/stream — see app/routers/stream.py */
export type StreamEvent =
  | { type: "step_complete"; step: PipelineStep }
  | { type: "report"; report: { report_data: StructuredReport } & ReportDetail }
  | { type: "error"; message: string };

/**
 * Consumes the SSE stream from /analyze/stream using fetch + ReadableStream
 * (rather than EventSource) so we can attach the same auth header logic
 * used everywhere else via apiFetch's token getter, which native EventSource
 * doesn't support.
 */
export async function streamAnalysis(
  companyName: string,
  onEvent: (event: StreamEvent) => void,
  llmProvider?: string | null,
  signal?: AbortSignal,
): Promise<void> {
  const params = new URLSearchParams({ company_name: companyName });
  if (llmProvider) params.set("llm_provider", llmProvider);

  const headers = new Headers();
  const token = await getCurrentAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}/analyze/stream?${params.toString()}`, {
    headers,
    signal,
  });

  if (!response.ok || !response.body) {
    onEvent({ type: "error", message: `Stream failed to start (${response.status})` });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const rawEvent of events) {
      const lines = rawEvent.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const eventType = eventLine.replace("event:", "").trim();
      const data = JSON.parse(dataLine.replace("data:", "").trim());

      if (eventType === "step_complete") {
        onEvent({ type: "step_complete", step: data });
      } else if (eventType === "report") {
        onEvent({ type: "report", report: data.report ?? data });
      } else if (eventType === "error") {
        onEvent({ type: "error", message: data.message });
      }
    }
  }
}
