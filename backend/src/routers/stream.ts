import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/middleware';
import { createPendingReport, logApiCall, sendReportEmail } from '../services/reportService';
import { investmentResearchGraph } from '../agents/graph';
import { getLLMProviderName } from '../llm';
import { prisma } from '../db';

const router = Router();

const PIPELINE_STEPS = [
  { id: 'research_profile', label: 'Researching company profile' },
  { id: 'collect_news', label: 'Collecting recent news' },
  { id: 'sentiment_and_risk', label: 'Analyzing sentiment and risk signals' },
  { id: 'llm_reasoning', label: 'Reasoning through findings' },
];

function sendSseEvent(res: Response, event: string, data: any) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

router.get('/stream', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const companyName = req.query.company_name as string;
  const llmProvider = req.query.llm_provider as string | undefined;

  if (!companyName) {
    return res.status(400).json({ error: 'company_name is required' });
  }

  const userId = req.user!.id;
  const report = await createPendingReport(userId, companyName);

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable NGINX buffering
  });

  const startTime = Date.now();

  // Update report to running in db
  await prisma.report.update({
    where: { id: report.id },
    data: { status: 'running' },
  });

  let state: any = {
    companyName: companyName,
    llmProviderOverride: llmProvider || null,
    toolResults: [],
  };

  try {
    const stream = await investmentResearchGraph.stream(state);

    for await (const chunk of stream) {
      for (const [nodeName, nodeOutput] of Object.entries(chunk)) {
        const stepMeta = PIPELINE_STEPS.find(s => s.id === nodeName);
        if (stepMeta) {
          sendSseEvent(res, 'step_complete', stepMeta);
        }
        state = { ...state, ...(nodeOutput as any) };
      }
    }

    if (state.error || !state.structuredReport) {
      const errMsg = state.error || 'Agent produced no structured report';
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'failed',
          errorMessage: errMsg,
        },
      });

      await logApiCall(userId, report.id, 'agent_pipeline', 'analyze', false, Date.now() - startTime, errMsg);
      sendSseEvent(res, 'error', { message: errMsg });
      return res.end();
    }

    const structured = state.structuredReport;
    const providerUsed = getLLMProviderName(llmProvider || null);

    const completed = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: 'completed',
        ticker: structured.ticker || null,
        verdict: structured.verdict === 'INVEST' ? 'INVEST' : 'PASS',
        investmentScore: structured.investment_score || null,
        confidenceScore: structured.confidence_score || null,
        reportData: structured as any,
        completedAt: new Date(),
        llmProviderUsed: providerUsed,
      },
    });

    await logApiCall(userId, report.id, 'agent_pipeline', 'analyze', true, Date.now() - startTime);

    // Trigger SMTP email notification
    await sendReportEmail(completed, userId);

    sendSseEvent(res, 'report', {
      id: completed.id,
      company_name: completed.companyName,
      ticker: completed.ticker,
      status: completed.status,
      verdict: completed.verdict,
      investment_score: completed.investmentScore,
      confidence_score: completed.confidenceScore,
      report_data: structured,
      error_message: completed.errorMessage,
      llm_provider_used: completed.llmProviderUsed,
      is_favorite: completed.isFavorite,
      created_at: completed.createdAt.toISOString(),
      completed_at: completed.completedAt?.toISOString() || null,
    });

    res.end();
  } catch (error: any) {
    console.error('Streaming analysis failed:', error);
    const errMsg = `Unexpected error: ${error.message || error}`;

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: 'failed',
        errorMessage: errMsg,
      },
    });

    await logApiCall(userId, report.id, 'agent_pipeline', 'analyze', false, Date.now() - startTime, errMsg);
    sendSseEvent(res, 'error', { message: errMsg });
    res.end();
  }
});

export default router;
