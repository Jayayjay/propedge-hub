"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Mail, Lock, User, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const perks = [
  "Track unlimited prop challenges",
  "Real-time MT5 drawdown monitoring",
  "Never breach a rule accidentally",
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed. Please try again.");
      return;
    }

    setSent(true);
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
            <TrendingUp className="h-[18px] w-[18px] text-black" />
          </div>
          <span className="text-xl font-black tracking-tight">
            PropEdge<span className="text-[#22C55E]">Hub</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#111] p-7 shadow-2xl">
          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-[#F1F1F1] mb-1">Create your account</h1>
              <p className="text-sm text-[#666] mb-5">Free forever · No credit card required</p>

              <ul className="space-y-1.5 mb-6">
                {perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-[#888]">
                    <Check className="h-3 w-3 text-[#22C55E]" />
                    {p}
                  </li>
                ))}
              </ul>

              {error && (
                <div className="mb-4 rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                    <Input
                      id="name"
                      placeholder="John Trader"
                      className="pl-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Min. 8 characters"
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </>
          ) : (
            /* ── Email sent state ── */
            <div className="text-center py-2">
              <div className="h-14 w-14 rounded-full bg-[#22C55E]/15 flex items-center justify-center mx-auto mb-5">
                <Mail className="h-6 w-6 text-[#22C55E]" />
              </div>
              <h2 className="text-lg font-bold text-[#F1F1F1] mb-2">Check your inbox</h2>
              <p className="text-sm text-[#666] leading-relaxed mb-1">
                We sent a verification link to
              </p>
              <p className="text-sm font-semibold text-[#F1F1F1] mb-4">{email}</p>
              <p className="text-xs text-[#555] leading-relaxed mb-6">
                Click the link in the email to activate your account. It expires in 24 hours.
              </p>
              <Button variant="ghost" className="text-xs w-full" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          )}
        </div>

        {!sent && (
          <p className="text-center text-xs text-[#555] mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-[#22C55E] hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
