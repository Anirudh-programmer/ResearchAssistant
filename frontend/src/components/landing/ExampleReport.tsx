import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreGauge } from "@/components/report/ScoreGauge";
import { SignalList } from "@/components/report/SignalList";
import { VerdictStamp } from "@/components/report/VerdictStamp";

export function ExampleReport() {
  return (
    <section id="example" className="border-b border-border bg-surface/40 py-20 md:py-28">
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            An example report
          </h2>
          <p className="mt-3 text-ink-muted">
            This is a sample, illustrative report — real analyses are generated live by the agent.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12"
        >
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="data-figure flex items-center gap-2 text-sm text-ink-faint">
                    <span>NVDA</span>
                    <span>·</span>
                    <span>Semiconductors</span>
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-ink">
                    NVIDIA Corporation
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                    NVIDIA remains the dominant supplier of AI-training and
                    inference GPUs, with data-center revenue continuing to
                    outpace the broader semiconductor market.
                  </p>
                </div>
                <VerdictStamp verdict="INVEST" size="sm" />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-8 border-y border-border py-6">
                <ScoreGauge score={84} label="Investment score" size={88} />
                <ScoreGauge score={78} label="Confidence" size={88} />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="invest">Strong demand</Badge>
                  <Badge variant="invest">Margin expansion</Badge>
                  <Badge variant="pass">Valuation risk</Badge>
                  <Badge variant="pass">Export policy risk</Badge>
                </div>
              </div>

              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Positive signals
                  </h4>
                  <SignalList
                    tone="positive"
                    items={[
                      "Data-center segment grew well above company average last quarter",
                      "Sustained design-win momentum across major cloud providers",
                      "Gross margins expanding despite supply constraints",
                    ]}
                  />
                </div>
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Major risks
                  </h4>
                  <SignalList
                    tone="risk"
                    items={[
                      "Valuation already prices in years of continued hypergrowth",
                      "Export restrictions could limit access to key markets",
                      "Customer concentration among a small number of hyperscalers",
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
