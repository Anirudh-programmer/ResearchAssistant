import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('Investment Research Agent'),
  API_V1_PREFIX: z.string().default('/api/v1'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_JWKS_URL: z.string().optional(),
  CLERK_ISSUER: z.string().optional(),
  DEFAULT_LLM_PROVIDER: z.enum(['gemini', 'openai', 'anthropic']).default('gemini'),
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  TAVILY_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  FINNHUB_API_KEY: z.string().optional(),
  SECRET_KEY: z.string().default('change-me-to-a-random-string'),
  MOCK_LLM: z.preprocess((val) => val === 'true' || val === '1', z.boolean()).default(false),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const parsed = configSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

export const isDev = config.NODE_ENV === 'development';
export const isProd = config.NODE_ENV === 'production';

// Helper properties mimicking python settings structure
export const settings = {
  isProduction: isProd,
  mockLlmEnabled: config.MOCK_LLM,
  authConfigured: !!(config.CLERK_SECRET_KEY && config.CLERK_JWKS_URL && config.CLERK_ISSUER),
  llmProvidersConfigured: {
    gemini: !!config.GOOGLE_API_KEY,
    openai: !!config.OPENAI_API_KEY,
    anthropic: !!config.ANTHROPIC_API_KEY,
  },
  toolsConfigured: {
    tavily: !!config.TAVILY_API_KEY,
    news_api: !!config.NEWS_API_KEY,
    finnhub: !!config.FINNHUB_API_KEY,
  },
};
export type Config = z.infer<typeof configSchema>;
export default config;
