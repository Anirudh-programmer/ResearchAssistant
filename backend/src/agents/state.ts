import { Annotation } from '@langchain/langgraph';
import { ToolResult } from '../tools/base';

export const AgentStateAnnotation = Annotation.Root({
  companyName: Annotation<string>(),
  llmProviderOverride: Annotation<string | null>({
    reducer: (oldVal, newVal) => newVal,
    default: () => null,
  }),
  ticker: Annotation<string | null>({
    reducer: (oldVal, newVal) => newVal,
    default: () => null,
  }),
  industry: Annotation<string | null>({
    reducer: (oldVal, newVal) => newVal,
    default: () => null,
  }),
  toolResults: Annotation<ToolResult[]>({
    reducer: (oldVal, newVal) => (oldVal || []).concat(newVal),
    default: () => [],
  }),
  currentStep: Annotation<string>({
    reducer: (oldVal, newVal) => newVal,
    default: () => '',
  }),
  completedSteps: Annotation<string[]>({
    reducer: (oldVal, newVal) => (oldVal || []).concat(newVal),
    default: () => [],
  }),
  structuredReport: Annotation<Record<string, any> | null>({
    reducer: (oldVal, newVal) => newVal,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (oldVal, newVal) => newVal,
    default: () => null,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
