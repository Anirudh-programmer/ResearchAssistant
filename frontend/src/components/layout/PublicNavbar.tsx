import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { Stamp } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuthAvailability } from "@/contexts/AuthContext";

export function PublicNavbar() {
  const { clerkConfigured } = useAuthAvailability();
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-6 md:px-12 lg:px-16 xl:px-24">
        <Link to="/" className="flex items-center gap-2">
          <Stamp className="size-5 text-accent" />
          <span className="font-display text-lg font-semibold tracking-tight">Verdict</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-muted md:flex">
          <a href="#features" className="transition-colors hover:text-ink">
            Features
          </a>
          <a href="#example" className="transition-colors hover:text-ink">
            Example report
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {clerkConfigured ? (
            isSignedIn ? (
              <Button variant="accent" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="accent" size="sm">
                    Get started
                  </Button>
                </SignUpButton>
              </>
            )
          ) : (
            <Button variant="accent" size="sm" asChild>
              <Link to="/research">Try the demo</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
