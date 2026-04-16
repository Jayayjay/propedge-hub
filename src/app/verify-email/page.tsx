"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TrendingUp, XCircle, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, { icon: React.ReactNode; title: string; body: string }> = {
  invalid: {
    icon: <XCircle className="h-6 w-6 text-[#EF4444]" />,
    title: "Invalid link",
    body: "This verification link is not recognised. It may have already been used.",
  },
  expired: {
    icon: <Clock className="h-6 w-6 text-[#F59E0B]" />,
    title: "Link expired",
    body: "This verification link has expired (links are valid for 24 hours). Sign up again to get a new one.",
  },
  missing: {
    icon: <XCircle className="h-6 w-6 text-[#EF4444]" />,
    title: "Incomplete link",
    body: "The verification link is missing required parameters. Please use the full link from your email.",
  },
};

function VerifyEmailContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "invalid";
  const info = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-96 w-96 rounded-full bg-[#EF4444]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22C55E]">
            <TrendingUp className="h-[18px] w-[18px] text-black" />
          </div>
          <span className="text-xl font-black tracking-tight">
            PropEdge<span className="text-[#22C55E]">Hub</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#111] p-7 shadow-2xl text-center">
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            {info.icon}
          </div>
          <h1 className="text-lg font-bold text-[#F1F1F1] mb-2">{info.title}</h1>
          <p className="text-sm text-[#666] mb-6 leading-relaxed">{info.body}</p>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/signup">
                <Mail className="h-4 w-4 mr-2" />
                Sign up again
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
