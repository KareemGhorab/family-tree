import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loader2
        className="h-10 w-10 animate-spin text-zinc-400 dark:text-zinc-500"
        aria-hidden
      />
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </p>
    </div>
  );
}
