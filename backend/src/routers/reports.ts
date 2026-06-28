import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/middleware';
import { listReports, getReportById, deleteReport, setFavorite } from '../services/reportService';

const router = Router();

// GET /api/v1/reports (paginated history list)
router.get('/reports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const userId = req.user!.id;

    const { items, total } = await listReports(userId, page, pageSize);

    const formattedItems = items.map(report => ({
      id: report.id,
      company_name: report.companyName,
      ticker: report.ticker,
      status: report.status,
      verdict: report.verdict,
      investment_score: report.investmentScore,
      confidence_score: report.confidenceScore,
      is_favorite: report.isFavorite,
      created_at: report.createdAt.toISOString(),
      completed_at: report.completedAt?.toISOString() || null,
    }));

    return res.status(200).json({
      items: formattedItems,
      total,
      page,
      page_size: pageSize,
    });
  } catch (error: any) {
    console.error('List reports error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/report/:id (report detail)
router.get('/report/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const report = await getReportById(id, userId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({
      id: report.id,
      company_name: report.companyName,
      ticker: report.ticker,
      status: report.status,
      verdict: report.verdict,
      investment_score: report.investmentScore,
      confidence_score: report.confidenceScore,
      report_data: report.reportData,
      error_message: report.errorMessage,
      llm_provider_used: report.llmProviderUsed,
      is_favorite: report.isFavorite,
      created_at: report.createdAt.toISOString(),
      completed_at: report.completedAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Get report error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/report/:id (delete report)
router.delete('/report/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const success = await deleteReport(id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Delete report error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/favorite (toggle favorite)
router.post('/favorite', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { report_id, is_favorite } = req.body;
    if (!report_id) {
      return res.status(400).json({ error: 'report_id is required' });
    }

    const userId = req.user!.id;
    const updated = await setFavorite(report_id, userId, is_favorite ?? true);

    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({
      id: updated.id,
      company_name: updated.companyName,
      ticker: updated.ticker,
      status: updated.status,
      verdict: updated.verdict,
      investment_score: updated.investmentScore,
      confidence_score: updated.confidenceScore,
      report_data: updated.reportData,
      error_message: updated.errorMessage,
      llm_provider_used: updated.llmProviderUsed,
      is_favorite: updated.isFavorite,
      created_at: updated.createdAt.toISOString(),
      completed_at: updated.completedAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Set favorite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
