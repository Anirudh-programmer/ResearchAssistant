import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/middleware';
import {
  getOrCreateSettings,
  updateSettings,
  listSavedCompanyBookmarks,
  addSavedCompany,
  removeSavedCompanyBookmark,
  getApiUsageSummary,
} from '../services/userService';

const router = Router();

// GET /api/v1/profile (user profile information)
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    id: req.user!.id,
    clerk_user_id: req.user!.clerkUserId,
    email: req.user!.email,
    full_name: req.user!.fullName,
    avatar_url: req.user!.avatarUrl,
  });
});

// GET /api/v1/settings (user settings/preferences)
router.get('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await getOrCreateSettings(req.user!.id);
    return res.status(200).json({
      theme: settings.theme,
      preferred_llm_provider: settings.preferredLlmProvider,
      email_notifications: settings.emailNotifications,
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/settings (update preferences)
router.patch('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { theme, preferred_llm_provider, email_notifications } = req.body;
    const settings = await updateSettings(req.user!.id, {
      theme,
      preferredLlmProvider: preferred_llm_provider,
      emailNotifications: email_notifications,
    });

    return res.status(200).json({
      theme: settings.theme,
      preferred_llm_provider: settings.preferredLlmProvider,
      email_notifications: settings.emailNotifications,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/saved-companies (bookmarks list)
router.get('/saved-companies', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companies = await listSavedCompanyBookmarks(req.user!.id);
    const formatted = companies.map(c => ({
      id: c.id,
      company_name: c.companyName,
      ticker: c.ticker,
      notes: c.notes,
      source: c.source,
      created_at: c.createdAt.toISOString(),
    }));
    return res.status(200).json(formatted);
  } catch (error: any) {
    console.error('List saved companies error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/saved-companies (add bookmark)
router.post('/saved-companies', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { company_name, ticker, notes } = req.body;
    if (!company_name || typeof company_name !== 'string') {
      return res.status(400).json({ error: 'company_name is required and must be a string' });
    }

    const saved = await addSavedCompany(req.user!.id, company_name, ticker, notes);
    return res.status(200).json({
      id: saved.id,
      company_name: saved.companyName,
      ticker: saved.ticker,
      notes: saved.notes,
      created_at: saved.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Add saved company error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/saved-companies/:id (remove bookmark)
router.delete('/saved-companies/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await removeSavedCompanyBookmark(id, req.user!.id);

    if (!success) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    return res.status(200).json({ message: 'Bookmark removed successfully' });
  } catch (error: any) {
    console.error('Delete saved company error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/usage (quota/usage logs)
router.get('/usage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await getApiUsageSummary(req.user!.id);
    return res.status(200).json(summary);
  } catch (error: any) {
    console.error('Get API usage error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
