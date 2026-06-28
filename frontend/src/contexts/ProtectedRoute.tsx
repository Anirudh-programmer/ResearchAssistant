import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

import { useAuthAvailability } from "@/contexts/AuthContext";

/**
 * Gate for authenticated-only pages (dashboard, research, history, account).
 *
 * - Clerk configured: real sign-in is enforced — signed-out users are
 *   redirected to the Clerk sign-in flow.
 * - Clerk NOT configured (dev mode): everyone passes through, since the
 *   backend is already running its own dev-mode auto-user fallback and
 *   there is nothing real to gate yet.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { clerkConfigured } = useAuthAvailability();

  if (!clerkConfigured) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

/** Redirects authenticated users away from public-only pages (landing CTA, sign-in). */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { clerkConfigured } = useAuthAvailability();

  if (!clerkConfigured) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedOut>{children}</SignedOut>
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
    </>
  );
}
