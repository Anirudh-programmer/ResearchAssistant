import { motion } from "framer-motion";
import { Database, GitBranch, Repeat, ScrollText, ShieldCheck, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: GitBranch,
    title: "Multi-step reasoning",
    description:
      "A LangGraph pipeline researches profile, news, sentiment, and risk in sequence — then reasons over everything together, not in isolation.",
  },
  {
    icon: Database,
    title: "Multiple live sources",
    description:
      "Tavily web search, Finnhub financials, NewsAPI, and Wikipedia are combined into one research bundle before the model ever reasons.",
  },
  {
    icon: ScrollText,
    title: "Full transparency",
    description:
      "Every verdict comes with detailed reasoning, a confidence score, and the exact sources used — never a black-box answer.",
  },
  {
    icon: Repeat,
    title: "Swap LLMs freely",
    description:
      "Gemini, OpenAI, or Anthropic — change providers from one config file, with automatic fallback if a key is missing.",
  },
  {
    icon: ShieldCheck,
    title: "Graceful by design",
    description:
      "Missing an API key doesn't break the pipeline. Every research tool degrades gracefully and the agent reasons with whatever it has.",
  },
  {
    icon: Sparkles,
    title: "Built to last",
    description:
      "Every report is saved, searchable, and re-runnable — your research history compounds instead of evaporating.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-border bg-surface/40 py-20 md:py-28">
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Research like an analyst, not a search bar
          </h2>
          <p className="mt-3 text-ink-muted">
            Every report runs the same disciplined process — no shortcuts, no
            generic summaries.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full transition-colors duration-200 hover:border-border-strong">
                <CardContent className="pt-5">
                  <feature.icon className="size-5 text-accent" />
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
