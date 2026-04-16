"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justVerified = params.get("verified") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error.includes("EMAIL_NOT_VERIFIED")) {
        setError(
          "Please verify your email before signing in. Check your inbox for the verification link."
        );
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-96 w-96 rounded-full bg-[#22C55E]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22C55E]">
            <TrendingUp className="h-4.5 w-4.5 text-black" />
          </div>
          <span className="text-xl font-black tracking-tight">
            PropEdge<span className="text-[#22C55E]">Hub</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#111] p-7 shadow-2xl">
          <h1 className="text-xl font-bold text-[#F1F1F1] mb-1">Welcome back</h1>
          <p className="text-sm text-[#666] mb-6">Sign in to your account to continue.</p>

          {/* Verification success banner */}
          {justVerified && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#22C55E]/20 bg-[#22C55E]/10 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-[#22C55E] mt-0.5 shrink-0" />
              <p className="text-sm text-[#22C55E]">
                Email verified! You can now sign in.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#555] mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#22C55E] hover:underline">
            Sign up free
          </Link>
        </p>

        <p className="text-center text-[10px] text-[#444] mt-3">
          By signing in you agree to our{" "}
          <a href="#" className="hover:underline">Terms</a> &amp;{" "}
          <a href="#" className="hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
