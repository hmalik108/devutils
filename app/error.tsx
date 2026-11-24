"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/** Route-level error boundary. Reports only that an error happened — never inputs or messages. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    track("tool_error", { action: "render_error" });
  }, []);
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" role="alert">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">The page hit an unexpected error. Your input was not sent anywhere.</p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
