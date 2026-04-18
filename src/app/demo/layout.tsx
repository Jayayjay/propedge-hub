import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Demo banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
        style={{ background: "#fff", color: "#000", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-black/40 inline-block" />
            Demo Mode — you&apos;re viewing sample data
          </span>
          <span className="hidden sm:inline text-black/40">· Live MT5 sync, real alerts, and your actual P&L appear after sign-up</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-black hover:bg-black/5">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="h-7 text-xs bg-black text-white hover:bg-black/80">Sign up free</Button>
          </Link>
        </div>
      </div>

      {/* Simplified top bar */}
      <header className="h-12 border-b flex items-center px-5 gap-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L6 7L9 10L13 4" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text)" }}>
            PropEdge<span style={{ color: "var(--text-faint)" }}>Hub</span>
          </span>
        </div>

        {/* Fake nav items */}
        {["Dashboard", "Challenges", "History", "Alerts"].map((item) => (
          <span
            key={item}
            className="text-xs px-2 py-1 rounded cursor-default select-none"
            style={{
              color: item === "Dashboard" ? "var(--text)" : "var(--text-faint)",
              background: item === "Dashboard" ? "var(--surface-2)" : "transparent",
            }}
          >
            {item}
          </span>
        ))}

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] inline-block" />
          <span style={{ color: "var(--text-muted)" }}>Demo data</span>
        </div>
      </header>

      <main className="p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
