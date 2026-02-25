import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-6 text-zinc-100">
      <WifiOff className="size-16 text-zinc-500" />
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-center text-zinc-400">
        Check your connection and try again.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Try again</Link>
      </Button>
    </div>
  );
}
