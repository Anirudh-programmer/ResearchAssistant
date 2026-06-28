import { AgentState } from '../state';
import { fetchNewsApi, fetchFinnhubNews, searchTavily } from '../../tools';
import { ToolResultHelper } from '../../tools/base';

export async function collectNewsNode(state: AgentState): Promise<Partial<AgentState>> {
  const companyName = state.companyName;
  const ticker = state.ticker;

  const results = await Promise.all([
    fetchNewsApi(companyName),
    ticker
      ? fetchFinnhubNews(ticker)
      : Promise.resolve(ToolResultHelper.unavailable('finnhub_news', 'Skipped — no ticker resolved')),
    searchTavily(`${companyName} latest news recent developments`),
  ]);

  return {
    toolResults: results,
    currentStep: 'collect_news',
    completedSteps: ['collect_news'],
  };
}
