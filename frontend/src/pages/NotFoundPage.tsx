import { Stamp } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <Stamp className="size-8 text-ink-faint" />
      <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Button variant="accent" asChild>
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}
