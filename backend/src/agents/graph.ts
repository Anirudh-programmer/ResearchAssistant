import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation } from './state';
import { researchProfileNode } from './nodes/profile';
import { collectNewsNode } from './nodes/news';
import { sentimentAndRiskNode } from './nodes/sentiment';
import { reasoningNode } from './nodes/reasoning';

export function buildGraph() {
  return new StateGraph(AgentStateAnnotation)
    .addNode('research_profile', researchProfileNode)
    .addNode('collect_news', collectNewsNode)
    .addNode('sentiment_and_risk', sentimentAndRiskNode)
    .addNode('llm_reasoning', reasoningNode)
    
    .addEdge(START, 'research_profile')
    .addEdge('research_profile', 'collect_news')
    .addEdge('collect_news', 'sentiment_and_risk')
    .addEdge('sentiment_and_risk', 'llm_reasoning')
    .addEdge('llm_reasoning', END)
    
    .compile();
}

export const investmentResearchGraph = buildGraph();
