import { Router, Response, Request } from 'express';
import { settings, config } from '../config';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok' });
});

router.get('/status', (req: Request, res: Response) => {
  return res.status(200).json({
    auth_configured: settings.authConfigured,
    llm_providers: settings.llmProvidersConfigured,
    research_tools: settings.toolsConfigured,
    default_llm_provider: config.DEFAULT_LLM_PROVIDER,
    mock_llm_enabled: settings.mockLlmEnabled,
  });
});

export default router;
