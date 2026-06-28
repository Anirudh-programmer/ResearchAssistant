import { motion } from "framer-motion";

const steps = [
  { label: "Research profile", detail: "Company background, industry, ticker resolution" },
  { label: "Collect news", detail: "Recent headlines across multiple news sources" },
  { label: "Sentiment & risk", detail: "Investor sentiment, controversies, regulatory exposure" },
  { label: "Reason & decide", detail: "Synthesis, SWOT, scoring, and the final verdict" },
];

export function HowItWorks() {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            One input. Four stages. One verdict.
          </h2>
          <p className="mt-3 text-ink-muted">
            Watch the pipeline run in real time on the research page.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-card border border-border bg-surface p-5"
            >
              <span className="data-figure text-xs text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-3 text-sm font-semibold text-ink">{step.label}</p>
              <p className="mt-1.5 text-sm text-ink-muted">{step.detail}</p>
              {i < steps.length - 1 && (
                <div className="absolute -right-2.5 top-1/2 hidden h-px w-5 -translate-y-1/2 bg-border-strong md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
