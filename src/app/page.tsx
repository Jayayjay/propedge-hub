"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, Shield, Bell, BarChart3, Zap, ChevronRight,
  Check, Star, Activity, Target, Users, Building2, Zap as ZapIcon, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { icon: Users,     val: "500+",  label: "Active Traders"       },
  { icon: Building2, val: "12+",   label: "Prop Firms Supported" },
  { icon: ZapIcon,   val: "FREE",  label: "To Get Started"       },
  { icon: Clock,     val: "99.9%", label: "Uptime SLA"           },
];

const plans = [
  {
    name: "Free", monthlyPrice: 0, annualPrice: 0, period: "",
    desc: "Get started tracking your first challenge", popular: false,
    features: ["1 active challenge", "Basic equity tracking", "Email alerts", "7-day history"],
    cta: "Start Free",
  },
  {
    name: "Pro", monthlyPrice: 10, annualPrice: 8, period: "/month",
    desc: "For serious prop firm traders", popular: true,
    features: ["Unlimited challenges", "Live MT5 sync", "WhatsApp + Email alerts", "PDF report exports", "Advanced analytics", "Priority support"],
    cta: "Start Pro",
  },
  {
    name: "Elite", monthlyPrice: 17, annualPrice: 14, period: "/month",
    desc: "For full-time funded traders", popular: false,
    features: ["Everything in Pro", "MT5 trade copier", "API access", "Dedicated account manager", "Custom firm rules", "White-label reports"],
    cta: "Start Elite",
  },
];

const testimonials = [
  { quote: "Passed FTUK Phase 2 on first try thanks to the drawdown alerts. Game changer.", name: "Adebayo O.", role: "Funded Trader", firm: "FTUK" },
  { quote: "WhatsApp alerts saved me from breaching my daily limit at least 3 times this month.", name: "Tunde A.", role: "Full-time Trader", firm: "Nova Funded" },
  { quote: "The MT5 sync is seamless. I can see my P&L update in real-time while I trade.", name: "Emeka R.", role: "Part-time Trader", firm: "E8 Markets" },
];

// ─── 3D Candlestick scene ──────────────────────────────────────────────────────

function genCandles(count: number, startPrice: number, seed: number) {
  const rng = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
  const candles: { o: number; h: number; l: number; c: number }[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const r1 = rng(seed + i * 3);
    const r2 = rng(seed + i * 3 + 1);
    const r3 = rng(seed + i * 3 + 2);
    const o = price;
    const move = (r1 - 0.45) * 8;
    const c = o + move;
    const bodySize = Math.abs(c - o);
    const wickMult = 0.4 + r2 * 1.2;
    const h = Math.max(o, c) + bodySize * wickMult * r3;
    const l = Math.min(o, c) - bodySize * wickMult * (1 - r3);
    candles.push({ o, h: Math.max(h, Math.max(o, c) + 0.5), l: Math.min(l, Math.min(o, c) - 0.5), c });
    price = c;
  }
  return candles;
}

const SEED = 7.3;
const STATIC_CANDLES = genCandles(13, 50, SEED);

function Candles3D() {
  const [liveClose, setLiveClose] = useState(() => STATIC_CANDLES[STATIC_CANDLES.length - 1].o);

  useEffect(() => {
    let t = 0;
    let id: number;
    const last = STATIC_CANDLES[STATIC_CANDLES.length - 1];
    const range = last.h - last.o;
    const tick = () => {
      t += 0.009;
      setLiveClose(last.o + range * (0.2 + Math.abs(Math.sin(t)) * 0.75));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const candles = useMemo(
    () => STATIC_CANDLES.map((c, i) => i === STATIC_CANDLES.length - 1 ? { ...c, c: liveClose } : c),
    [liveClose],
  );

  const CW = 18, G = 11, D = 9, PH = 260, PAD = 26;
  const allPrices = candles.flatMap((c) => [c.o, c.c, c.h, c.l]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const scale = (PH - PAD * 2) / (maxP - minP || 1);
  const toY = (p: number) => Math.round((PH - PAD - (p - minP) * scale) * 100) / 100;
  const svgW = candles.length * (CW + G) + D + 6;

  return (
    <svg width={svgW} height={PH} viewBox={`0 0 ${svgW} ${PH}`} style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {candles.map((c, i) => {
        const isLast = i === candles.length - 1;
        const isBull = c.c >= c.o;
        const x = i * (CW + G);
        const bodyY = toY(Math.max(c.c, c.o));
        const bodyH = Math.max(Math.abs(toY(c.o) - toY(c.c)), 2.5);
        const bodyBot = bodyY + bodyH;
        const cx = x + CW / 2;
        const front = isBull ? "rgba(34,197,94,0.90)" : "rgba(239,68,68,0.88)";
        const frontStroke = isBull ? "rgba(74,222,128,0.35)" : "rgba(252,165,165,0.25)";
        const sideCol = isBull ? "rgba(21,128,61,0.85)" : "rgba(185,28,28,0.88)";
        const topCol = isBull ? "rgba(74,222,128,0.80)" : "rgba(252,165,165,0.65)";
        const wickCol = isBull ? "rgba(34,197,94,0.60)" : "rgba(239,68,68,0.55)";
        const col = isBull ? "#22C55E" : "#EF4444";
        const glowFilter = isLast ? (isBull ? "url(#glow-green)" : "url(#glow-red)") : undefined;
        return (
          <g key={i} style={{ animation: `candle-grow 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards ${i * 55}ms`, filter: glowFilter }}>
            <line x1={cx} y1={toY(c.h)} x2={cx} y2={bodyY} stroke={wickCol} strokeWidth="1.5" strokeLinecap="round" />
            <polygon points={`${x+CW},${bodyY} ${x+CW+D},${bodyY-D*0.55} ${x+CW+D},${bodyBot-D*0.55} ${x+CW},${bodyBot}`} fill={sideCol} />
            <polygon points={`${x},${bodyY} ${x+D},${bodyY-D*0.55} ${x+CW+D},${bodyY-D*0.55} ${x+CW},${bodyY}`} fill={topCol} />
            <rect x={x} y={bodyY} width={CW} height={bodyH} fill={front} stroke={frontStroke} strokeWidth="0.5" rx="0.5" />
            <line x1={cx} y1={bodyBot} x2={cx} y2={toY(c.l)} stroke={wickCol} strokeWidth="1.5" strokeLinecap="round" />
            {isLast && (
              <>
                <circle cx={cx} cy={bodyY} r="2.5" fill={col} />
                <circle cx={cx} cy={bodyY} r="2.5" fill="none" stroke={col} strokeWidth="1.5"
                  style={{ animation: "candle-live-ping 1.6s ease-out infinite" }} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Count-up stat number ──────────────────────────────────────────────────────

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const match = value.match(/^(\d+\.?\d*)(.*)/);
    if (!match) { setDisplay(value); return; }

    const target = parseFloat(match[1]);
    const suffix = match[2];
    const decimals = match[1].includes(".") ? (match[1].split(".")[1]?.length ?? 1) : 0;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const duration = 1400;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - p) ** 3;
        const cur = eased * target;
        setDisplay((decimals > 0 ? cur.toFixed(decimals) : Math.floor(cur).toString()) + suffix);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display ?? (value.match(/^\d/) ? "0" : value)}</span>;
}

// ─── SVG background patterns ───────────────────────────────────────────────────
const patterns: Record<string, string> = {
  dots:  `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E")`,
  lines: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8h16' stroke='rgba(255,255,255,0.07)' stroke-width='1'/%3E%3C/svg%3E")`,
  grid:  `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 0v16M0 8h16' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
};

// ─── Prop Firm Card (tilt, used in marquee) ────────────────────────────────────
type ImgStage = "clearbit" | "google" | "mark";

function FirmCard({ firm }: { firm: typeof firms[0] }) {
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
      className="tilt-card shrink-0 rounded-xl overflow-hidden cursor-default"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        width: 148,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div
        className="flex items-center justify-center h-16"
        style={{
          background: stage === "mark" ? "#111" : "#fff",
          backgroundImage: stage === "mark" ? patterns[firm.pattern] : "none",
        }}
      >
        {stage === "mark" ? (
          <span className="text-xl font-black tracking-tight select-none" style={{ color: "#fff" }}>
            {firm.mark}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={stage}
            src={stage === "clearbit" ? info.logo : info.fallback}
            alt={info.name}
            width={64}
            height={64}
            className="object-contain p-2"
            onLoad={(e) => { if (e.currentTarget.naturalWidth <= 1) setStage("google"); }}
            onError={() => setStage(stage === "clearbit" ? "google" : "mark")}
          />
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{info.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[9px]" style={{ color: "var(--text-faint)" }}>{firm.type}</p>
          <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {firm.max}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Firms infinite marquee ────────────────────────────────────────────────────
function FirmsMarquee() {
  const doubled = [...firms, ...firms];
  return (
    <div className="marquee-pause relative overflow-hidden py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10"
        style={{ background: "linear-gradient(to right, var(--bg-subtle), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10"
        style={{ background: "linear-gradient(to left, var(--bg-subtle), transparent)" }} />
      <div className="flex gap-3 animate-marquee" style={{ width: "max-content" }}>
        {doubled.map((firm, i) => (
          <FirmCard key={`${firm.logoKey}-${i}`} firm={firm} />
        ))}
      </div>
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div
      className="shrink-0 rounded-xl p-5 cursor-default"
      style={{ width: 300, border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, j) => (
          <Star key={j} className="h-3.5 w-3.5" style={{ fill: "var(--text)", color: "var(--text)", opacity: 0.65 }} />
        ))}
      </div>
      <p className="text-sm italic leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.name}</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t.role}</p>
        </div>
        <span className="text-[9px] font-medium px-2 py-1 rounded-full"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          {t.firm}
        </span>
      </div>
    </div>
  );
}

// ─── Testimonials marquee ──────────────────────────────────────────────────────
function TestimonialsMarquee() {
  return (
    <div className="marquee-pause overflow-hidden">
      <div className="flex gap-3 animate-marquee" style={{ width: "max-content" }}>
        {[...testimonials, ...testimonials, ...testimonials, ...testimonials].map((t, i) => (
          <TestimonialCard key={i} t={t} />
        ))}
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
      <div className="grid grid-cols-4 gap-2.5 p-4 pb-3">
        {[
          { label: "Equity",     value: "$102,380", color: "#fff",    change: "+2.38%" },
          { label: "Daily Loss", value: "-0.8%",    color: "#aaa",    change: "4.2% left" },
          { label: "Max DD",     value: "4.2%",     color: "#aaa",    change: "5.8% buffer" },
          { label: "Profit",     value: "+2.38%",   color: "#22C55E", change: "→ 10% target" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg bg-white/4 p-2.5" style={{ transform: "translateZ(8px)" }}>
            <p className="text-[9px] text-white/30 mb-1">{k.label}</p>
            <p className="text-sm font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[9px] text-white/20 mt-0.5">{k.change}</p>
          </div>
        ))}
      </div>
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
      <div className="px-4 pb-4 space-y-1.5" style={{ transform: "translateZ(6px)" }}>
        {[
          { sym: "XAUUSD", type: "BUY",  profit: "+$93.00", pos: true  },
          { sym: "EURUSD", type: "SELL", profit: "+$36.00", pos: true  },
          { sym: "GBPUSD", type: "BUY",  profit: "-$49.50", pos: false },
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
      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <Icon className="h-5 w-5" style={{ color: f.mono }} />
      </div>
      <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text)" }}>{f.title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
    </div>
  );
}

// ─── CTA section with spotlight + cycling headline ─────────────────────────────
const CTA_HEADLINES = [
  "Ready to protect your challenges?",
  "Stop blowing prop firm accounts.",
  "Never breach a rule again.",
  "Track every challenge, live.",
];

function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [spotStyle, setSpotStyle] = useState<React.CSSProperties>({});
  const [hlIdx, setHlIdx] = useState(0);
  const [hlVisible, setHlVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setHlVisible(false);
      setTimeout(() => {
        setHlIdx((i) => (i + 1) % CTA_HEADLINES.length);
        setHlVisible(true);
      }, 380);
    }, 3400);
    return () => clearInterval(t);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSpotStyle({
      background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.05), transparent 50%)`,
    });
  }, []);

  const onMouseLeave = useCallback(() => setSpotStyle({}), []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="py-24 px-4 text-center relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* mouse-tracking spotlight */}
      <div className="pointer-events-none absolute inset-0 transition-all duration-75" style={spotStyle} />

      {/* spinning rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="animate-spin-slow absolute w-[600px] h-[600px] rounded-full"
          style={{ border: "1px solid var(--border)" }} />
        <div className="animate-counter-spin absolute w-[400px] h-[400px] rounded-full"
          style={{ border: "1px dashed rgba(255,255,255,0.03)" }} />
        <div className="animate-spin-slow absolute w-[900px] h-[900px] rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.015)", animationDuration: "40s" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <h2
          className="text-4xl md:text-5xl font-black mb-4"
          style={{
            color: "var(--text)",
            opacity: hlVisible ? 1 : 0,
            transform: hlVisible ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
            minHeight: "3.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {CTA_HEADLINES[hlIdx]}
        </h2>
        <p className="mb-8 text-base" style={{ color: "var(--text-muted)" }}>
          Join hundreds of traders who never blow challenges anymore.
        </p>
        <Link href="/signup">
          <button
            className="inline-flex items-center gap-2 rounded-xl px-10 py-3.5 text-base font-bold transition-all hover:scale-105 hover:opacity-90 active:scale-95"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            Get Started Free <ChevronRight className="h-4 w-4" />
          </button>
        </Link>
        <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
          No credit card · Free forever plan available
        </p>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled]   = useState(false);
  const [annual,   setAnnual]     = useState(false);

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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--text)", color: "var(--bg)" }}>
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight">
            PropEdge<span style={{ color: "var(--text-muted)" }}>Hub</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
          {["#features", "#pricing", "#firms"].map((href) => (
            <a key={href} href={href} className="transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
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
            <Button size="sm" style={{ background: "var(--text)", color: "var(--bg)", fontWeight: 700 }}>
              Start Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden min-h-screen flex flex-col items-center justify-center">
        {/* 3D Candlesticks */}
        <div className="animate-candle-scene pointer-events-none absolute hidden xl:block"
          style={{ left: "2%", top: "50%", marginTop: "-125px", opacity: 0.42, filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.55))", zIndex: 1 }}>
          <Candles3D />
        </div>
        <div className="animate-candle-scene pointer-events-none absolute hidden xl:block"
          style={{ right: "1%", top: "50%", marginTop: "-90px", opacity: 0.28, filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.45)) scaleX(-1)", transform: "scaleX(-1)", zIndex: 1, animationDelay: "4.5s" }}>
          <Candles3D />
        </div>

        {/* Orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-orb absolute rounded-full" style={{ width: 700, height: 700, top: "5%", left: "50%", marginLeft: -350, background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="animate-orb-2 absolute rounded-full" style={{ width: 400, height: 400, top: "20%", right: "5%", background: "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)", filter: "blur(50px)" }} />
          <div className="animate-spin-slow absolute rounded-full" style={{ width: 600, height: 600, top: "50%", left: "50%", marginTop: -300, marginLeft: -300, border: "1px solid rgba(255,255,255,0.04)" }} />
          <div className="animate-counter-spin absolute rounded-full" style={{ width: 800, height: 800, top: "50%", left: "50%", marginTop: -400, marginLeft: -400, border: "1px dashed rgba(255,255,255,0.025)" }} />
        </div>

        {/* Text */}
        <div className="relative z-10 max-w-4xl mx-auto text-center mb-14">
          <div className="animate-fade-up anim-hidden delay-100" style={{ animationFillMode: "forwards" }}>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs mb-6"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse inline-block" />
              Now with Live MT5 Sync
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05] animate-fade-up anim-hidden delay-200"
            style={{ animationFillMode: "forwards", color: "var(--text)" }}>
            Never Blow Another
            <br />
            <span className="text-transparent"
              style={{ backgroundImage: "var(--heading-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
              Prop Challenge
            </span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up anim-hidden delay-300"
            style={{ color: "var(--text-muted)", animationFillMode: "forwards" }}>
            Real-time tracking for all your prop firm challenges. Monitor drawdown, profit targets,
            and rule compliance with live MT5 data — all in one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up anim-hidden delay-400"
            style={{ animationFillMode: "forwards" }}>
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base px-8"
                style={{ background: "var(--text)", color: "var(--bg)", fontWeight: 700, boxShadow: "0 0 0 1px var(--border)" }}>
                Start Free — No Card Required
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="gap-2 text-base"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                View Demo Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-xs mt-4 animate-fade-in anim-hidden delay-600"
            style={{ color: "var(--text-faint)", animationFillMode: "forwards" }}>
            Trusted by 500+ prop traders · FTUK · FunderPro · Nova · E8 and more
          </p>
        </div>

        {/* 3D card */}
        <div className="relative z-10 w-full max-w-4xl mx-auto animate-fade-up anim-hidden delay-500"
          style={{ animationFillMode: "forwards", perspective: "1200px" }}>
          <Hero3DCard />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full"
            style={{ width: "70%", height: 40, background: "rgba(255,255,255,0.04)", filter: "blur(20px)" }} />
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
        <div className="relative z-10 mt-16 flex flex-col items-center gap-1 animate-fade-in anim-hidden delay-800"
          style={{ animationFillMode: "forwards" }}>
          <div className="h-8 w-5 rounded-full border-2 flex items-start justify-center pt-1"
            style={{ borderColor: "var(--border)" }}>
            <div className="h-1.5 w-1 rounded-full animate-bounce" style={{ background: "var(--text-faint)" }} />
          </div>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Scroll</span>
        </div>
      </section>

      {/* ── Prop Firm Marquee ─────────────────────────────────────────────────── */}
      <section id="firms" className="py-20 border-y" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
        <div className="max-w-5xl mx-auto px-4 mb-10">
          <div className="text-center">
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
        </div>

        <FirmsMarquee />

        <p className="text-center text-xs mt-8 px-4" style={{ color: "var(--text-faint)" }}>
          Don&apos;t see your firm?{" "}
          <Link href="/signup" className="underline underline-offset-2" style={{ color: "var(--text-muted)" }}>
            Request it →
          </Link>
        </p>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4" style={{ background: "var(--bg)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block rounded-full px-3 py-1 text-xs mb-4 animate-fade-up anim-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", animationFillMode: "forwards" }}>
              Features
            </div>
            <h2 className="text-3xl font-black mb-3 animate-fade-up anim-hidden delay-100"
              style={{ animationFillMode: "forwards", color: "var(--text)" }}>
              Everything you need to pass your challenge
            </h2>
            <p className="max-w-xl mx-auto animate-fade-up anim-hidden delay-200"
              style={{ color: "var(--text-muted)", animationFillMode: "forwards" }}>
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
                <div key={s.label}
                  className="flex flex-col items-center justify-center py-10 gap-1 animate-fade-up anim-hidden"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards", borderColor: "var(--border)" }}>
                  <Icon className="h-4 w-4 mb-2 opacity-30" style={{ color: "var(--text)" }} />
                  <p className="text-4xl font-black leading-none tabular-nums" style={{ color: "var(--text)" }}>
                    <CountUp value={s.val} />
                  </p>
                  <p className="text-xs mt-1 text-center" style={{ color: "var(--text-faint)" }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Testimonials marquee ──────────────────────────────────────────────── */}
      <section className="py-20 overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="text-center mb-10 px-4">
          <p className="text-xs uppercase tracking-[0.2em] font-medium mb-2" style={{ color: "var(--text-faint)" }}>
            Testimonials
          </p>
          <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
            Traders love it
          </h2>
        </div>
        <TestimonialsMarquee />
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4" style={{ background: "var(--bg-subtle)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block rounded-full px-3 py-1 text-xs mb-4"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
              Pricing
            </div>
            <h2 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>
              Simple, transparent pricing
            </h2>
            <p className="mb-6" style={{ color: "var(--text-muted)" }}>No hidden fees · Cancel anytime</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 rounded-full p-1"
              style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
              <button
                onClick={() => setAnnual(false)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
                style={!annual
                  ? { background: "var(--text)", color: "var(--bg)" }
                  : { background: "transparent", color: "var(--text-muted)" }
                }
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all flex items-center gap-2"
                style={annual
                  ? { background: "var(--text)", color: "var(--bg)" }
                  : { background: "transparent", color: "var(--text-muted)" }
                }
              >
                Annual
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{
                    background: annual ? "rgba(34,197,94,0.25)" : "var(--accent-dim)",
                    color: "#22C55E",
                  }}
                >
                  Save ~20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, i) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              const displayPrice = price === 0 ? "$0" : `$${price}`;
              return (
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
                  <p className="text-sm font-bold" style={{ color: plan.popular ? "var(--bg)" : "var(--text)" }}>
                    {plan.name}
                  </p>
                  <div className="my-3 flex items-end gap-1">
                    <span
                      className="text-3xl font-black tabular-nums"
                      style={{
                        color: plan.popular ? "var(--bg)" : "var(--text)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {displayPrice}
                    </span>
                    {plan.period && (
                      <span className="text-sm mb-0.5" style={{ color: plan.popular ? "rgba(0,0,0,0.4)" : "var(--text-faint)" }}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  {annual && price > 0 && (
                    <p className="text-[10px] -mt-1 mb-1" style={{ color: plan.popular ? "rgba(0,0,0,0.4)" : "var(--text-faint)" }}>
                      billed ${price * 12}/yr
                    </p>
                  )}
                  <p className="text-xs mb-5" style={{ color: plan.popular ? "rgba(0,0,0,0.55)" : "var(--text-muted)" }}>
                    {plan.desc}
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs"
                        style={{ color: plan.popular ? "rgba(0,0,0,0.7)" : "var(--text-muted)" }}>
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
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <CTASection />

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
              <a key={l} href="#" className="transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}>
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
