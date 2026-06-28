import { AgentState } from '../state';
import { searchTavily } from '../../tools';

export async function sentimentAndRiskNode(state: AgentState): Promise<Partial<AgentState>> {
  const companyName = state.companyName;

  const [sentimentResult, riskResult] = await Promise.all([
    searchTavily(`${companyName} investor sentiment analyst opinion`),
    searchTavily(`${companyName} risks controversies lawsuits regulatory challenges`),
  ]);

  return {
    toolResults: [sentimentResult, riskResult],
    currentStep: 'sentiment_and_risk',
    completedSteps: ['sentiment_and_risk'],
  };
}
