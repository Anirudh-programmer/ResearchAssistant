import { SignUp, useClerk, useAuth } from "@clerk/clerk-react";
import { Stamp } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuthAvailability } from "@/contexts/AuthContext";

export function SignUpPage() {
  const { clerkConfigured } = useAuthAvailability();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      signOut().then(() => {
        navigate("/sign-up", { replace: true });
      });
    }
  }, [isSignedIn, signOut, navigate]);

  if (!clerkConfigured) {
    return <Navigate to="/research" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-canvas px-4">
      <Link to="/" className="flex items-center gap-2">
        <Stamp className="size-6 text-accent" />
        <span className="font-display text-xl font-semibold tracking-tight text-ink">Verdict</span>
      </Link>
      <SignUp
        forceRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#4f7a9e",
            colorBackground: "#14161a",
            colorText: "#f0f0ec",
            colorInputBackground: "#0a0b0d",
            borderRadius: "0.625rem",
          },
        }}
      />
    </div>
  );
}
