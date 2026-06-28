import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { config } from '../config';

export class LLMProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

/**
 * Gemini model fallback chain — each model has its own free-tier quota.
 * Order: primary (from .env) → cheaper/lighter alternatives → larger alternatives
 */
const GEMINI_MODEL_CHAIN = [
  config.GEMINI_MODEL,                // e.g. gemini-2.0-flash (from .env)
  'gemini-2.5-flash-lite',            // lightest, separate quota
  'gemini-2.5-flash',                 // mid-range, separate quota
  'gemini-2.0-flash-lite',            // lightweight 2.0 variant
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

export function buildGeminiWithModel(modelName: string) {
  if (!config.GOOGLE_API_KEY) {
    throw new LLMProviderError('GOOGLE_API_KEY is not set');
  }
  return new ChatGoogleGenerativeAI({
    apiKey: config.GOOGLE_API_KEY,
    modelName,
    temperature: 0.1,
    maxRetries: 1,  // don't let LangChain retry 6 times (wastes quota wait time)
  });
}

function buildGemini() {
  return buildGeminiWithModel(config.GEMINI_MODEL);
}

function buildOpenAI() {
  if (!config.OPENAI_API_KEY) {
    throw new LLMProviderError('OPENAI_API_KEY is not set');
  }
  return new ChatOpenAI({
    apiKey: config.OPENAI_API_KEY,
    modelName: config.OPENAI_MODEL,
    temperature: 0.1,
  });
}

function buildAnthropic() {
  if (!config.ANTHROPIC_API_KEY) {
    throw new LLMProviderError('ANTHROPIC_API_KEY is not set');
  }
  return new ChatAnthropic({
    apiKey: config.ANTHROPIC_API_KEY,
    modelName: config.ANTHROPIC_MODEL,
    temperature: 0.1,
  });
}

const PROVIDER_REGISTRY: Record<string, () => any> = {
  gemini: buildGemini,
  openai: buildOpenAI,
  anthropic: buildAnthropic,
};

const FALLBACK_ORDER = ['gemini', 'openai', 'anthropic'];

export function getLLMProvider(preferred?: string | null): any {
  const candidates = [preferred, config.DEFAULT_LLM_PROVIDER, ...FALLBACK_ORDER];
  const tried = new Set<string>();

  for (const name of candidates) {
    if (!name || tried.has(name) || !PROVIDER_REGISTRY[name]) {
      continue;
    }
    tried.add(name);
    try {
      return PROVIDER_REGISTRY[name]();
    } catch (error) {
      if (error instanceof LLMProviderError) {
        continue;
      }
      throw error;
    }
  }

  const configured = Object.entries({
    gemini: !!config.GOOGLE_API_KEY,
    openai: !!config.OPENAI_API_KEY,
    anthropic: !!config.ANTHROPIC_API_KEY,
  })
    .filter(([_, val]) => val)
    .map(([key]) => key);

  throw new LLMProviderError(
    `No LLM provider is configured. Set at least one of GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY in .env. (Currently configured: ${
      configured.length > 0 ? configured.join(', ') : 'none'
    })`
  );
}

export function getLLMProviderName(preferred?: string | null): string {
  try {
    const candidates = [preferred, config.DEFAULT_LLM_PROVIDER, ...FALLBACK_ORDER];
    for (const name of candidates) {
      if (name && PROVIDER_REGISTRY[name]) {
        // Test build
        PROVIDER_REGISTRY[name]();
        return name;
      }
    }
  } catch {}
  return config.DEFAULT_LLM_PROVIDER;
}

export { GEMINI_MODEL_CHAIN };
