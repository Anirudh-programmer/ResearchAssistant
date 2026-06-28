import { SignUpButton, useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { VerdictStamp } from "@/components/report/VerdictStamp";
import { useAuthAvailability } from "@/contexts/AuthContext";

export function Hero() {
  const { clerkConfigured } = useAuthAvailability();
  const { isSignedIn } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-border min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="mx-auto grid w-full gap-12 px-6 py-10 md:grid-cols-2 md:items-center md:px-12 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="data-figure text-xs uppercase tracking-[0.2em] text-accent">
            AI Investment Research
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-5xl">
            Every company deserves a verdict, not a vibe.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Give it a name. The agent researches financials, news, sentiment, and
            risk across multiple sources, reasons through what it finds, and
            stamps a verdict — INVEST or PASS — with the reasoning to back it up.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {clerkConfigured ? (
              isSignedIn ? (
                <Button size="lg" variant="accent" asChild>
                  <Link to="/research">
                    Start researching <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button size="lg" variant="accent">
                    Start researching <ArrowRight className="size-4" />
                  </Button>
                </SignUpButton>
              )
            ) : (
              <Button size="lg" variant="accent" asChild>
                <Link to="/research">
                  Try the demo <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <a href="#example">See an example report</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto flex w-full max-w-sm items-center justify-center"
        >
          <div className="w-full rounded-card border border-border bg-surface p-6 shadow-2xl">
            <div className="data-figure flex items-center justify-between text-xs text-ink-faint">
              <span>NVDA · NVIDIA Corporation</span>
              <span>Score 84</span>
            </div>
            <div className="mt-6 flex items-center justify-center py-4">
              <VerdictStamp verdict="INVEST" size="lg" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Dominant data-center GPU share, accelerating AI infrastructure
              demand, and expanding margins outweigh valuation and export-policy risk.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
