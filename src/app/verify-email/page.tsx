"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, Clock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, { icon: React.ReactNode; title: string; body: string }> = {
  invalid: {
    icon: <XCircle className="h-6 w-6 text-[#EF4444]" />,
    title: "Invalid link",
    body: "This verification link isn't recognised. It may have already been used.",
  },
  expired: {
    icon: <Clock className="h-6 w-6 text-[#888]" />,
    title: "Link expired",
    body: "Verification links are valid for 24 hours. Sign up again to get a new one.",
  },
  missing: {
    icon: <AlertCircle className="h-6 w-6 text-[#888]" />,
    title: "Incomplete link",
    body: "The verification link is missing required parameters. Please use the full link from your email.",
  },
};

function VerifyEmailContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "invalid";
  const info = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L6 7L9 10L13 4" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            PropEdge<span className="text-white/50">Hub</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-7 shadow-2xl shadow-black/60 text-center">
          <div className="h-14 w-14 rounded-full border border-white/8 bg-white/5 flex items-center justify-center mx-auto mb-5">
            {info.icon}
          </div>
          <h1 className="text-lg font-bold text-white mb-2">{info.title}</h1>
          <p className="text-sm text-[#555] mb-8 leading-relaxed">{info.body}</p>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/signup">
                <Mail className="h-4 w-4" />
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
