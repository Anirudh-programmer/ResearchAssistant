import { AgentState } from '../state';
import { resolveTicker, fetchWikipediaSummary, fetchFinnhubProfile } from '../../tools';
import { ToolResultHelper } from '../../tools/base';

export async function researchProfileNode(state: AgentState): Promise<Partial<AgentState>> {
  const companyName = state.companyName;

  const tickerResult = await resolveTicker(companyName);
  const ticker = tickerResult.available ? (tickerResult.data as string) : null;

  const [wikiResult, finnhubResult] = await Promise.all([
    fetchWikipediaSummary(companyName),
    ticker
      ? fetchFinnhubProfile(ticker)
      : Promise.resolve(ToolResultHelper.unavailable('finnhub', 'Skipped — no ticker resolved')),
  ]);

  return {
    ticker,
    toolResults: [tickerResult, wikiResult, finnhubResult],
    currentStep: 'research_profile',
    completedSteps: ['research_profile'],
  };
}
