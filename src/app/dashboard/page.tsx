"use client";

import { useEffect, useState } from "react";
import { LiveDashboard } from "@/components/prop-tracker/live-dashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Target } from "lucide-react";

export default function DashboardPage() {
  const [challengeId, setChallengeId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/challenges?status=active")
      .then((r) => r.json())
      .then((data) => {
        const first = data.challenges?.[0];
        setChallengeId(first?.id ?? null);
      })
      .catch(() => setChallengeId(null));
  }, []);

  if (challengeId === undefined) {
    // Loading
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (challengeId === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <Target className="h-14 w-14 text-white/10" />
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text)" }}>No active challenge</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            Add your first prop firm challenge to start tracking.
          </p>
        </div>
        <Button asChild className="gap-2 mt-2">
          <Link href="/dashboard/challenges">
            <Plus className="h-4 w-4" />
            Add Challenge
          </Link>
        </Button>
      </div>
    );
  }

  return <LiveDashboard challengeId={challengeId} />;
}
