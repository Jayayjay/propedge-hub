"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const perks = [
  "Real-time MT5 drawdown monitoring",
  "Never breach a prop rule accidentally",
  "WhatsApp & email alerts before limits",
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Subtle grid overlay */}
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

        <div className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-7 shadow-2xl shadow-black/60">
          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
              <p className="text-sm text-[#555] mb-6">Free forever · No credit card required</p>

              <ul className="space-y-2 mb-6 pb-6 border-b border-white/5">
                {perks.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-xs text-[#666]">
                    <span className="h-1 w-1 rounded-full bg-white/40 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>

              {error && (
                <div className="mb-5 rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/8 px-4 py-3 text-sm text-[#EF4444]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[#888] text-xs font-medium uppercase tracking-wider">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
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
                  <Label htmlFor="email" className="text-[#888] text-xs font-medium uppercase tracking-wider">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
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
                  <Label htmlFor="password" className="text-[#888] text-xs font-medium uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-1" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Create Account <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="h-14 w-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-sm text-[#555] leading-relaxed mb-1">We sent a verification link to</p>
              <p className="text-sm font-semibold text-white mb-4">{email}</p>
              <p className="text-xs text-[#444] leading-relaxed mb-7">
                Click the link to activate your account. It expires in 24 hours.
              </p>
              <Button variant="secondary" className="text-xs w-full" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          )}
        </div>

        {!sent && (
          <p className="text-center text-xs text-[#444] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:text-white/80 underline underline-offset-4">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
