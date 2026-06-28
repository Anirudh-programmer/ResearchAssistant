import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { createContext, useContext, useEffect } from "react";

import { registerAuthTokenGetter } from "@/services/api";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

interface AuthAvailability {
  /** Whether Clerk is actually configured in this build. If false, the app
   * runs against the backend's dev-mode auto-user — see app/auth/dependencies.py. */
  clerkConfigured: boolean;
}

const AuthAvailabilityContext = createContext<AuthAvailability>({ clerkConfigured: false });

export function useAuthAvailability() {
  return useContext(AuthAvailabilityContext);
}

/** Wires Clerk's getToken() into the API client's bearer-token injection. */
function ClerkTokenBridge({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    registerAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}

/**
 * Root auth provider. If VITE_CLERK_PUBLISHABLE_KEY is unset (e.g. local dev
 * before Clerk is configured), renders children directly with no Clerk
 * context at all — the backend's dev-mode user fallback takes over, and
 * the rest of the app works identically either way. This mirrors the
 * backend's `auth_configured` graceful-degradation pattern by design.
 */
export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <AuthAvailabilityContext.Provider value={{ clerkConfigured: false }}>
        {children}
      </AuthAvailabilityContext.Provider>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AuthAvailabilityContext.Provider value={{ clerkConfigured: true }}>
        <ClerkTokenBridge>{children}</ClerkTokenBridge>
      </AuthAvailabilityContext.Provider>
    </ClerkProvider>
  );
}
