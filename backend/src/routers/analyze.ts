import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/middleware';
import { createPendingReport, runAnalysis, getReportById } from '../services/reportService';

const router = Router();

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_name, llm_provider } = req.body;
    if (!company_name || typeof company_name !== 'string') {
      return res.status(400).json({ error: 'company_name is required and must be a string' });
    }

    const userId = req.user!.id;
    const report = await createPendingReport(userId, company_name);
    const completed = await runAnalysis(report.id, userId, llm_provider);

    return res.status(200).json({
      id: completed.id,
      company_name: completed.companyName,
      ticker: completed.ticker,
      status: completed.status,
      verdict: completed.verdict,
      investment_score: completed.investmentScore,
      confidence_score: completed.confidenceScore,
      report_data: completed.reportData,
      error_message: completed.errorMessage,
      llm_provider_used: completed.llmProviderUsed,
      is_favorite: completed.isFavorite,
      created_at: completed.createdAt.toISOString(),
      completed_at: completed.completedAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Analyze controller error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/:report_id/retry', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { report_id } = req.params;
    const userId = req.user!.id;

    const report = await getReportById(report_id, userId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const completed = await runAnalysis(report_id, userId);

    return res.status(200).json({
      id: completed.id,
      company_name: completed.companyName,
      ticker: completed.ticker,
      status: completed.status,
      verdict: completed.verdict,
      investment_score: completed.investmentScore,
      confidence_score: completed.confidenceScore,
      report_data: completed.reportData,
      error_message: completed.errorMessage,
      llm_provider_used: completed.llmProviderUsed,
      is_favorite: completed.isFavorite,
      created_at: completed.createdAt.toISOString(),
      completed_at: completed.completedAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Retry controller error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
