"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, Shield, Bell, BarChart3, Zap, ChevronRight,
  Check, Star, Activity, Target, Users, Building2, Zap as ZapIcon, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { propFirmLogos, type PropFirm } from "@/lib/prop-firms";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  { icon: Activity,  title: "Live Equity Tracking",      desc: "Real-time equity curve synced directly from MT5. See your P&L update live as trades close.",                              mono: "#fff" },
  { icon: Shield,    title: "Rule Breach Protection",     desc: "Instant alerts before you breach daily loss or max drawdown limits. Never lose a challenge to a silly mistake.",           mono: "#ddd" },
  { icon: Bell,      title: "Smart Alerts",               desc: "Email and WhatsApp notifications when you approach limits. Configurable thresholds per firm.",                             mono: "#ccc" },
  { icon: BarChart3, title: "Multi-Challenge Dashboard",  desc: "Track all your challenges across FTUK, FunderPro, Nova, E8 and more in one clean dashboard.",                             mono: "#fff" },
  { icon: Target,    title: "Firm-Specific Rules",        desc: "Pre-loaded rule sets for all major prop firms. Add any custom firm with your own parameters.",                             mono: "#ddd" },
  { icon: Zap,       title: "PDF Performance Reports",    desc: "Export professional reports showing your equity curve, win rate, and rule compliance.",                                    mono: "#ccc" },
];

// Prop firm data — logoKey maps to propFirmLogos for Clearbit logo
const firms: Array<{ logoKey: PropFirm; mark: string; type: string; max: string; pattern: string }> = [
  { logoKey: "ftuk",         mark: "FT",  type: "2-Step Challenge", max: "$200K", pattern: "dots"  },
  { logoKey: "funderpro",    mark: "FP",  type: "2-Step Challenge", max: "$200K", pattern: "lines" },
  { logoKey: "novafunded",   mark: "N★",  type: "1-Step Challenge", max: "$100K", pattern: "grid"  },
  { logoKey: "e8markets",    mark: "E8",  type: "3-Step Challenge", max: "$300K", pattern: "dots"  },
  { logoKey: "myforexfunds", mark: "MFF", type: "2-Step Challenge", max: "$200K", pattern: "lines" },
  { logoKey: "fxify",        mark: "FX",  type: "1-Step Challenge", max: "$100K", pattern: "grid"  },
  { logoKey: "fundingpips",  mark: "FP",  type: "2-Step Challenge", max: "$200K", pattern: "dots"  },
  { logoKey: "the5ers",      mark: "5%",  type: "Hyper Growth",     max: "$4M",   pattern: "lines" },
];

const stats = [
  { icon: Users,    val: "500+",  label: "Active Traders"       },
  { icon: Building2,val: "12+",   label: "Prop Firms Supported" },
  { icon: ZapIcon,  val: "FREE",  label: "To Get Started"       },
  { icon: Clock,    val: "99.9%", label: "Uptime SLA"           },
];

const plans = [
  { name: "Free",  price: "$0",  period: "",       desc: "Get started tracking your first challenge", popular: false,
    features: ["1 active challenge", "Basic equity tracking", "Email alerts", "7-day history"], cta: "Start Free" },
  { name: "Pro",   price: "$10", period: "/month", desc: "For serious prop firm traders", popular: true,
    features: ["Unlimited challenges", "Live MT5 sync", "WhatsApp + Email alerts", "PDF report exports", "Advanced analytics", "Priority support"], cta: "Start Pro" },
  { name: "Elite", price: "$17", period: "/month", desc: "For full-time funded traders", popular: false,
    features: ["Everything in Pro", "MT5 trade copier", "API access", "Dedicated account manager", "Custom firm rules", "White-label reports"], cta: "Start Elite" },
];

const testimonials = [
  { quote: "Passed FTUK Phase 2 on first try thanks to the drawdown alerts. Game changer.", name: "Adebayo O.", role: "Funded Trader" },
  { quote: "Finally a clean dashboard that shows everything I need. No more Excel spreadsheets.", name: "Chidi N.", role: "Prop Trader" },
  { quote: "WhatsApp alerts saved me from breaching my daily limit at least 3 times this month.", name: "Tunde A.", role: "Full-time Trader" },
];

// ─── SVG background patterns (B&W subtle) ─────────────────────────────────────
const patterns: Record<string, string> = {
  dots:  `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E")`,
  lines: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8h16' stroke='rgba(255,255,255,0.07)' stroke-width='1'/%3E%3C/svg%3E")`,
  grid:  `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 0v16M0 8h16' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
};

// ─── Prop Firm Logo Card ───────────────────────────────────────────────────────
type ImgStage = "clearbit" | "google" | "mark";

function FirmCard({ firm, delay }: { firm: typeof firms[0]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<ImgStage>("clearbit");
  const info = propFirmLogos[firm.logoKey];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -12;
    el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-2px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="tilt-card rounded-xl overflow-hidden cursor-default animate-fade-up anim-hidden group"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Logo area */}
      <div
        className="relative flex items-center justify-center h-20"
        style={{
          background: stage === "mark" ? "#111" : "#fff",
          backgroundImage: stage === "mark" ? patterns[firm.pattern] : "none",
        }}
      >
        {stage === "mark" ? (
          <span
            className="text-2xl font-black tracking-tight select-none"
            style={{ color: "#fff", fontVariantNumeric: "tabular-nums" }}
          >
            {firm.mark}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={stage}
            src={stage === "clearbit" ? info.logo : info.fallback}
            alt={info.name}
            width={80}
            height={80}
            className="object-contain p-3"
            onLoad={(e) => {
              // Clearbit returns a blank 1px image when it has no logo
              if (e.currentTarget.naturalWidth <= 1) setStage("google");
            }}
            onError={() => setStage(stage === "clearbit" ? "google" : "mark")}
          />
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
          {info.name}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{firm.type}</p>
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            up to {firm.max}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Hero 3D Card ──────────────────────────────────────────────────────────────
function Hero3DCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef<number>(0);
  const target  = useRef({ rx: 8, ry: -4 });
  const current = useRef({ rx: 8, ry: -4 });

  const onMove = useCallback((e: MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    target.current = { rx: dy * -10, ry: dx * 10 };
  }, []);

  const onLeave = useCallback(() => { target.current = { rx: 8, ry: -4 }; }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const parent = card.parentElement!;
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);

    const tick = () => {
      current.current.rx += (target.current.rx - current.current.rx) * 0.08;
      current.current.ry += (target.current.ry - current.current.ry) * 0.08;
      if (card) card.style.transform = `perspective(1000px) rotateX(${current.current.rx}deg) rotateY(${current.current.ry}deg)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [onMove, onLeave]);

  return (
    <div
      ref={cardRef}
      className="glass-shimmer rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        background: "#0d0d0d",
        transform: "perspective(1000px) rotateX(8deg) rotateY(-4deg)",
        transformStyle: "preserve-3d",
        willChange: "transform",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/40">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/8"  />
        </div>
        <div className="flex-1 h-4 bg-white/5 rounded mx-6" />
        <div className="flex gap-1 items-center text-[10px] text-[#22C55E]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          Live
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5 p-4 pb-3">
        {[
          { label: "Equity",     value: "$102,380", color: "#fff",     change: "+2.38%" },
          { label: "Daily Loss", value: "-0.8%",    color: "#aaa",     change: "4.2% left" },
          { label: "Max DD",     value: "4.2%",     color: "#aaa",     change: "5.8% buffer" },
          { label: "Profit",     value: "+2.38%",   color: "#22C55E",  change: "→ 10% target" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg bg-white/4 p-2.5" style={{ transform: "translateZ(8px)" }}>
            <p className="text-[9px] text-white/30 mb-1">{k.label}</p>
            <p className="text-sm font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[9px] text-white/20 mt-0.5">{k.change}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mx-4 mb-3 h-28 rounded-lg bg-white/3 overflow-hidden" style={{ transform: "translateZ(4px)" }}>
        <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradBW" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#fff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0"    />
            </linearGradient>
          </defs>
          <path d="M0,65 C20,60 40,55 60,50 C80,45 100,52 120,44 C140,36 160,28 180,24 C200,20 220,30 240,22 C260,14 280,18 300,12 C320,8 340,14 360,10 L400,8 L400,80 L0,80 Z" fill="url(#chartGradBW)" />
          <path d="M0,65 C20,60 40,55 60,50 C80,45 100,52 120,44 C140,36 160,28 180,24 C200,20 220,30 240,22 C260,14 280,18 300,12 C320,8 340,14 360,10 L400,8" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <circle cx="400" cy="8" r="3" fill="#22C55E" />
          <circle cx="400" cy="8" r="6" fill="#22C55E" fillOpacity="0.2" />
        </svg>
      </div>

      {/* Mini trades */}
      <div className="px-4 pb-4 space-y-1.5" style={{ transform: "translateZ(6px)" }}>
        {[
          { sym: "XAUUSD", type: "BUY",  profit: "+$93.00",  pos: true  },
          { sym: "EURUSD", type: "SELL", profit: "+$36.00",  pos: true  },
          { sym: "GBPUSD", type: "BUY",  profit: "-$49.50",  pos: false },
        ].map((t) => (
          <div key={t.sym} className="flex items-center justify-between rounded bg-white/3 px-3 py-1.5 text-[10px]">
            <span className="font-mono text-white/60">{t.sym}</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${t.type === "BUY" ? "bg-white/10 text-white/70" : "bg-white/5 text-white/40"}`}>
              {t.type}
            </span>
            <span className={t.pos ? "text-[#22C55E] font-semibold" : "text-white/30 font-semibold"}>{t.profit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tilt feature card ────────────────────────────────────────────────────────
function FeatureCard({ f, delay }: { f: typeof features[0]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -14;
    el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  const Icon = f.icon;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="tilt-card rounded-xl p-5 cursor-default animate-fade-up anim-hidden"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <Icon className="h-5 w-5" style={{ color: f.mono }} />
      </div>
      <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text)" }}>{f.title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ───────────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300"
        style={{
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          background:   scrolled ? "var(--bg)"              : "transparent",
          backdropFilter: scrolled ? "blur(16px)"           : "none",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--text)", color: "var(--bg)" }}>
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight">
            PropEdge<span style={{ color: "var(--text-muted)" }}>Hub</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
          {["#features", "#pricing", "#firms"].map((href) => (
            <a
              key={href}
              href={href}
              className="transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {href.replace("#", "").replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm" style={{ color: "var(--text-muted)" }}>Log in</Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              style={{ background: "var(--text)", color: "var(--bg)", fontWeight: 700 }}
            >
              Start Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden min-h-screen flex flex-col items-center justify-center">
        {/* Monochrome orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-orb absolute rounded-full" style={{ width: 700, height: 700, top: "5%", left: "50%", marginLeft: -350, background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="animate-orb-2 absolute rounded-full" style={{ width: 400, height: 400, top: "20%", right: "5%", background: "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)", filter: "blur(50px)" }} />
          <div className="animate-spin-slow absolute rounded-full" style={{ width: 600, height: 600, top: "50%", left: "50%", marginTop: -300, marginLeft: -300, border: "1px solid rgba(255,255,255,0.04)" }} />
          <div className="animate-counter-spin absolute rounded-full" style={{ width: 800, height: 800, top: "50%", left: "50%", marginTop: -400, marginLeft: -400, border: "1px dashed rgba(255,255,255,0.025)" }} />
        </div>

        {/* Text */}
        <div className="relative z-10 max-w-4xl mx-auto text-center mb-14">
          <div className="animate-fade-up anim-hidden delay-100" style={{ animationFillMode: "forwards" }}>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs mb-6"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse inline-block" />
              Now with Live MT5 Sync
            </div>
          </div>

          <h1
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05] animate-fade-up anim-hidden delay-200"
            style={{ animationFillMode: "forwards", color: "var(--text)" }}
          >
            Never Blow Another
            <br />
            <span
              className="text-transparent"
              style={{
                backgroundImage: "var(--heading-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              Prop Challenge
            </span>
          </h1>

          <p
            className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up anim-hidden delay-300"
            style={{ color: "var(--text-muted)", animationFillMode: "forwards" }}
          >
            Real-time tracking for all your prop firm challenges. Monitor drawdown, profit targets,
            and rule compliance with live MT5 data — all in one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up anim-hidden delay-400" style={{ animationFillMode: "forwards" }}>
            <Link href="/signup">
              <Button
                size="lg"
                className="gap-2 text-base px-8"
                style={{ background: "var(--text)", color: "var(--bg)", fontWeight: 700, boxShadow: "0 0 0 1px var(--border)" }}
              >
                Start Free — No Card Required
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                View Demo Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-xs mt-4 animate-fade-in anim-hidden delay-600" style={{ color: "var(--text-faint)", animationFillMode: "forwards" }}>
            Trusted by 500+ prop traders · FTUK · FunderPro · Nova · E8 and more
          </p>
        </div>

        {/* 3D card */}
        <div className="relative z-10 w-full max-w-4xl mx-auto animate-fade-up anim-hidden delay-500" style={{ animationFillMode: "forwards", perspective: "1200px" }}>
          <Hero3DCard />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full" style={{ width: "70%", height: 40, background: "rgba(255,255,255,0.04)", filter: "blur(20px)" }} />

          {/* Floating chips */}
          {[
            { cls: "absolute -left-4 top-1/4 animate-float delay-200 hidden lg:block", icon: <div className="h-2 w-2 rounded-full bg-white/70" />, text: "+$1,284 this week" },
            { cls: "absolute -right-4 top-1/3 animate-float-slow delay-400 hidden lg:block", icon: <Shield className="h-3 w-3" style={{ color: "var(--text-muted)" }} />, text: "3 challenges protected" },
            { cls: "absolute -right-2 bottom-1/4 animate-float delay-600 hidden lg:block", icon: <Bell className="h-3 w-3" style={{ color: "var(--text-muted)" }} />, text: "Alert: 65% of limit" },
          ].map((c, i) => (
            <div key={i} className={c.cls} style={{ animationFillMode: "both" }}>
              <div className="rounded-xl px-3 py-2 text-xs font-semibold shadow-xl flex items-center gap-2"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {c.icon}{c.text}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="relative z-10 mt-16 flex flex-col items-center gap-1 animate-fade-in anim-hidden delay-800" style={{ animationFillMode: "forwards" }}>
          <div className="h-8 w-5 rounded-full border-2 flex items-start justify-center pt-1" style={{ borderColor: "var(--border)" }}>
            <div className="h-1.5 w-1 rounded-full animate-bounce" style={{ background: "var(--text-faint)" }} />
          </div>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Scroll</span>
        </div>
      </section>

      {/* ── Prop Firm Cards ───────────────────────────────────────────────────── */}
      <section id="firms" className="py-20 border-y" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] font-medium mb-2" style={{ color: "var(--text-faint)" }}>
              Supported Prop Firms
            </p>
            <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
              Works with all major firms
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Pre-loaded rules, limits, and drawdown calculations for each firm. More being added.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {firms.map((firm, i) => (
              <FirmCard key={firm.logoKey} firm={firm} delay={i * 55} />
            ))}
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-faint)" }}>
            Don't see your firm?{" "}
            <Link href="/signup" className="underline underline-offset-2" style={{ color: "var(--text-muted)" }}>
              Request it →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4" style={{ background: "var(--bg)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block rounded-full px-3 py-1 text-xs mb-4 animate-fade-up anim-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", animationFillMode: "forwards" }}>
              Features
            </div>
            <h2 className="text-3xl font-black mb-3 animate-fade-up anim-hidden delay-100" style={{ animationFillMode: "forwards", color: "var(--text)" }}>
              Everything you need to pass your challenge
            </h2>
            <p className="max-w-xl mx-auto animate-fade-up anim-hidden delay-200" style={{ color: "var(--text-muted)", animationFillMode: "forwards" }}>
              Built specifically for prop firm traders. No generic tools — just what you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => <FeatureCard key={f.title} f={f} delay={i * 80} />)}
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <div className="border-y" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "var(--border)" }}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center py-10 gap-1 animate-fade-up anim-hidden"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards", borderColor: "var(--border)" }}
                >
                  <Icon className="h-4 w-4 mb-2 opacity-30" style={{ color: "var(--text)" }} />
                  <p className="text-4xl font-black leading-none" style={{ color: "var(--text)" }}>{s.val}</p>
                  <p className="text-xs mt-1 text-center" style={{ color: "var(--text-faint)" }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "var(--bg)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={t.name} className="tilt-card rounded-xl p-5 animate-fade-up anim-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", animationDelay: `${i * 120}ms`, animationFillMode: "forwards" }}>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5" style={{ fill: "var(--text)", color: "var(--text)", opacity: 0.7 }} />
                ))}
              </div>
              <p className="text-sm italic mb-4" style={{ color: "var(--text-muted)" }}>&ldquo;{t.quote}&rdquo;</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.name}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4" style={{ background: "var(--bg-subtle)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block rounded-full px-3 py-1 text-xs mb-4"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
              Pricing
            </div>
            <h2 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>Simple, transparent pricing</h2>
            <p style={{ color: "var(--text-muted)" }}>Billed in USD · No hidden fees · Cancel anytime</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <div key={plan.name} className="relative rounded-xl p-6 tilt-card animate-fade-up anim-hidden"
                style={{
                  border: plan.popular ? "1px solid var(--text)" : "1px solid var(--border)",
                  background: plan.popular ? "var(--text)" : "var(--surface)",
                  animationDelay: `${i * 120}ms`,
                  animationFillMode: "forwards",
                }}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>
                    Most Popular
                  </div>
                )}
                <p className="text-sm font-bold" style={{ color: plan.popular ? "var(--bg)" : "var(--text)" }}>{plan.name}</p>
                <div className="my-3">
                  <span className="text-3xl font-black" style={{ color: plan.popular ? "var(--bg)" : "var(--text)" }}>{plan.price}</span>
                  {plan.period && <span className="text-sm ml-1" style={{ color: plan.popular ? "rgba(0,0,0,0.4)" : "var(--text-faint)" }}>{plan.period}</span>}
                </div>
                <p className="text-xs mb-5" style={{ color: plan.popular ? "rgba(0,0,0,0.55)" : "var(--text-muted)" }}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: plan.popular ? "rgba(0,0,0,0.7)" : "var(--text-muted)" }}>
                      <Check className="h-3.5 w-3.5 shrink-0" style={{ color: plan.popular ? "var(--bg)" : "var(--text)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <button
                    className="w-full rounded-lg py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                    style={plan.popular
                      ? { background: "var(--bg)", color: "var(--text)" }
                      : { border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }
                    }
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="animate-spin-slow absolute w-[600px] h-[600px] rounded-full" style={{ border: "1px solid var(--border)" }} />
          <div className="animate-counter-spin absolute w-[400px] h-[400px] rounded-full" style={{ border: "1px dashed rgba(255,255,255,0.03)" }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--text)" }}>Ready to protect your challenges?</h2>
          <p className="mb-8" style={{ color: "var(--text-muted)" }}>Join hundreds of traders who never blow challenges anymore.</p>
          <Link href="/signup">
            <button
              className="inline-flex items-center gap-2 rounded-xl px-10 py-3.5 text-base font-bold transition-opacity hover:opacity-90"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              Get Started Free <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
          <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>No credit card · Free forever plan available</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-4" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "var(--text)" }}>
              <TrendingUp className="h-3 w-3" style={{ color: "var(--bg)" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>PropEdgeHub</span>
          </div>
          <div className="flex gap-6 text-xs" style={{ color: "var(--text-faint)" }}>
            {["Privacy Policy", "Terms of Service", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                className="transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
              >
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>&copy; 2026 PropEdge Hub</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
