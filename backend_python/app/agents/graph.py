"""
The LangGraph pipeline definition.

Mirrors the spec's workflow:
  research profile -> collect news -> sentiment & risk -> LLM reasoning -> structured output

Each node is a pure async function over `AgentState`; LangGraph handles
state merging via the reducers defined in state.py. The graph is compiled
once at import time and reused across requests (compiling is not free).
"""
from langgraph.graph import END, StateGraph

from app.agents.nodes import (
    collect_news_node,
    research_profile_node,
    reasoning_node,
    sentiment_and_risk_node,
)
from app.agents.state import AgentState


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("research_profile", research_profile_node)
    graph.add_node("collect_news", collect_news_node)
    graph.add_node("sentiment_and_risk", sentiment_and_risk_node)
    graph.add_node("llm_reasoning", reasoning_node)

    graph.set_entry_point("research_profile")
    graph.add_edge("research_profile", "collect_news")
    graph.add_edge("collect_news", "sentiment_and_risk")
    graph.add_edge("sentiment_and_risk", "llm_reasoning")
    graph.add_edge("llm_reasoning", END)

    return graph.compile()


# Compiled once, reused for every analysis request.
investment_research_graph = build_graph()
