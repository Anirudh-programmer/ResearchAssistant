import { SignUpButton } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuthAvailability } from "@/contexts/AuthContext";

export function FinalCta() {
  const { clerkConfigured } = useAuthAvailability();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Stop guessing. Get a verdict.
        </h2>
        <p className="mt-4 text-ink-muted">
          Run your first analysis in under a minute.
        </p>
        <div className="mt-8 flex justify-center">
          {clerkConfigured ? (
            <SignUpButton mode="modal">
              <Button size="lg" variant="accent">
                Start researching <ArrowRight className="size-4" />
              </Button>
            </SignUpButton>
          ) : (
            <Button size="lg" variant="accent" asChild>
              <Link to="/research">
                Try the demo <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
