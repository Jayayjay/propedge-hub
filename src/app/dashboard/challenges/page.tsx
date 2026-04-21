"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, TrendingUp, ShieldAlert, Calendar, Target, Loader2, X, ChevronDown,
  Plug, PlugZap, MoreVertical, Trash2, Archive, CheckCircle2, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChallengeCardsSkeleton } from "@/components/prop-tracker/dashboard-skeleton";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { propFirmLogos, FIRM_PRESETS } from "@/lib/prop-firms";
import type { PropFirm } from "@/lib/prop-firms";
import { toast } from "@/lib/toast-store";

type TabKey = "active" | "completed";

type Challenge = {
  id: number;
  firm: string;
  phase: string;
  accountSize: number;
  profitTarget: number;
  maxDrawdownLimit: number;
  status: string;
  startDate: string | null;
  daysLeft: number | null;
  profitAchieved: number;
  maxDrawdown: number;
  hasLiveData: boolean;
};

type MT5Account = { id: number; label: string; accountNumber: string };

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "warning" | "destructive" | "secondary" | "info" }> = {
  active:    { label: "Active",  variant: "default" },
  passed:    { label: "Passed",  variant: "info" },
  failed:    { label: "Failed",  variant: "destructive" },
  funded:    { label: "Funded",  variant: "default" },
  completed: { label: "Done",    variant: "secondary" },
};

const FIRM_COLORS: Record<string, string> = {
  FTUK: "#6366F1", FunderPro: "#F59E0B", "E8 Markets": "#3B82F6",
  "Nova Funded": "#22C55E", FXIFY: "#EC4899", "Funding Pips": "#8B5CF6",
  "The5ers": "#14B8A6",
};
const firmColor = (name: string) => FIRM_COLORS[name] ?? "#888";

const PHASE_LABELS: Record<string, string> = {
  phase1: "Phase 1", phase2: "Phase 2", funded: "Funded",
};

const FIRMS = Object.entries(propFirmLogos).map(([key, v]) => ({ key: key as PropFirm, name: v.name }));

// ── New Challenge Modal ────────────────────────────────────────────────────────

type MT5Mode = "none" | "existing" | "new";

function NewChallengeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  // Challenge fields
  const [firm, setFirm]             = useState<PropFirm | "">("");
  const [phase, setPhase]           = useState<"phase1" | "phase2" | "funded">("phase1");
  const [accountSize, setAccountSize] = useState("");
  const [dailyDD, setDailyDD]       = useState("");
  const [maxDD, setMaxDD]           = useState("");
  const [profit, setProfit]         = useState("");
  const [minDays, setMinDays]       = useState("0");
  const [startDate, setStartDate]   = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate]       = useState("");

  // MT5 connectivity
  const [mt5Mode, setMt5Mode]       = useState<MT5Mode>("none");
  const [existingAccounts, setExistingAccounts] = useState<MT5Account[]>([]);
  const [selectedMt5Id, setSelectedMt5Id] = useState<number | "">("");
  // New account fields
  const [newLabel, setNewLabel]     = useState("");
  const [newAccNum, setNewAccNum]   = useState("");
  const [newServer, setNewServer]   = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    fetch("/api/mt5/accounts")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setExistingAccounts(d);
          setMt5Mode("existing");
          setSelectedMt5Id(d[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!firm) return;
    const preset = FIRM_PRESETS[firm]?.[phase];
    if (preset) {
      setDailyDD(String(preset.dailyDrawdownLimit * 100));
      setMaxDD(String(preset.maxDrawdownLimit * 100));
      setProfit(String(preset.profitTarget * 100));
      setMinDays(String(preset.minTradingDays));
    }
  }, [firm, phase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firm) { setError("Select a prop firm."); return; }
    if (!accountSize || isNaN(Number(accountSize))) { setError("Enter a valid account size."); return; }
    if (mt5Mode === "new" && (!newLabel || !newAccNum || !newServer || !newPassword)) {
      setError("Fill in all MT5 account fields or choose an existing account.");
      return;
    }

    setSaving(true);
    try {
      // Step 1: create MT5 account if needed
      let mt5AccountId: number | null = null;

      if (mt5Mode === "existing" && selectedMt5Id) {
        mt5AccountId = Number(selectedMt5Id);
      } else if (mt5Mode === "new") {
        const r = await fetch("/api/mt5/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label:         newLabel.trim(),
            accountNumber: newAccNum.trim(),
            serverName:    newServer.trim(),
            password:      newPassword,
          }),
        });
        if (!r.ok) {
          const d = await r.json();
          setError(d.error ?? "Failed to save MT5 account.");
          return;
        }
        const created = await r.json();
        mt5AccountId = created.id;
      }

      // Step 2: create challenge
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firm:               propFirmLogos[firm].name,
          phase,
          accountSize:        Number(accountSize),
          dailyDrawdownLimit: Number(dailyDD),
          maxDrawdownLimit:   Number(maxDD),
          profitTarget:       Number(profit),
          minTradingDays:     Number(minDays),
          mt5AccountId,
          startDate,
          endDate: endDate || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to create challenge.");
        return;
      }
      toast.success("Challenge created", `${propFirmLogos[firm as PropFirm].name} · ${PHASE_LABELS[phase]} is now tracked.`);
      onCreated();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-y-auto max-h-[90vh]"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>New Challenge</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/5" style={{ color: "var(--text-faint)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* ── Firm ── */}
          <div className="space-y-1.5">
            <Label>Prop Firm</Label>
            <div className="relative">
              <select
                value={firm}
                onChange={(e) => setFirm(e.target.value as PropFirm)}
                className="w-full appearance-none rounded-lg px-3 py-2 text-sm pr-8"
                style={{ ...selectStyle, color: firm ? "var(--text)" : "var(--text-faint)" }}
                required
              >
                <option value="" disabled>Select a firm…</option>
                {FIRMS.map((f) => (
                  <option key={f.key} value={f.key}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            </div>
          </div>

          {/* ── Phase ── */}
          <div className="space-y-1.5">
            <Label>Phase</Label>
            <div className="flex gap-2">
              {(["phase1", "phase2", "funded"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhase(p)}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                    phase === p ? "bg-white text-black" : "text-[#666] hover:text-white"
                  )}
                  style={phase !== p ? { background: "var(--surface-2)", border: "1px solid var(--border)" } : {}}
                >
                  {PHASE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Account size ── */}
          <div className="space-y-1.5">
            <Label>Account Size ($)</Label>
            <Input type="number" placeholder="100000" value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)} min={0} required />
          </div>

          {/* ── Rules ── */}
          <div className="space-y-1.5">
            <Label>
              Challenge Rules
              {firm && <span className="text-[10px] ml-1.5 font-normal" style={{ color: "var(--text-faint)" }}>auto-filled · edit if different</span>}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Daily Loss Limit (%)", val: dailyDD, set: setDailyDD, ph: "5" },
                { label: "Max Drawdown (%)",     val: maxDD,   set: setMaxDD,   ph: "10" },
                { label: "Profit Target (%)",    val: profit,  set: setProfit,  ph: "8" },
                { label: "Min Trading Days",     val: minDays, set: setMinDays, ph: "0", int: true },
              ].map(({ label, val, set, ph, int }) => (
                <div key={label} className="space-y-1">
                  <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{label}</p>
                  <Input type="number" step={int ? "1" : "0.1"} min="0" max={int ? undefined : "100"}
                    value={val} onChange={(e) => set(e.target.value)} placeholder={ph} required={label !== "Min Trading Days"} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Dates ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "var(--text-muted)" }}>End Date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* ── MT5 Connectivity ── */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <PlugZap className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              <Label className="mb-0">MT5 Account</Label>
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>optional — link for live tracking</span>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 p-0.5 rounded-lg w-fit" style={{ background: "var(--surface-2)" }}>
              {([
                { key: "none",     label: "Skip" },
                { key: "existing", label: `Existing${existingAccounts.length ? ` (${existingAccounts.length})` : ""}` },
                { key: "new",      label: "Add New" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMt5Mode(key)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all",
                    mt5Mode === key
                      ? "bg-white text-black shadow-sm"
                      : "hover:text-white"
                  )}
                  style={mt5Mode !== key ? { color: "var(--text-faint)" } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Existing account picker */}
            {mt5Mode === "existing" && (
              existingAccounts.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  No saved accounts. Use "Add New" to connect one.
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedMt5Id}
                    onChange={(e) => setSelectedMt5Id(Number(e.target.value))}
                    className="w-full appearance-none rounded-lg px-3 py-2 text-sm pr-8"
                    style={selectStyle}
                  >
                    {existingAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.label} · {a.accountNumber}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
              )
            )}

            {/* New account inline form */}
            {mt5Mode === "new" && (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>Label (nickname)</p>
                    <Input placeholder="My FTUK Account" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>Account Number</p>
                    <Input placeholder="12345678" value={newAccNum} onChange={(e) => setNewAccNum(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>Server</p>
                    <Input placeholder="FTUK-Server" value={newServer} onChange={(e) => setNewServer(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>Investor Password</p>
                    <Input type="password" placeholder="Read-only password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                </div>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  Investor (read-only) password only — the bridge cannot place or modify trades.
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-[#EF4444]">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {saving ? "Creating…" : "Create Challenge"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  return (
    <Suspense fallback={<ChallengeCardsSkeleton count={4} />}>
      <ChallengesPageInner />
    </Suspense>
  );
}

function ChallengesPageInner() {
  const [tab, setTab]                 = useState<TabKey>("active");
  const [challenges, setChallenges]   = useState<Challenge[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [actingId, setActingId]       = useState<number | null>(null);
  const searchParams                  = useSearchParams();
  const router                        = useRouter();
  const queryClient                   = useQueryClient();

  const loadChallenges = () => {
    setLoading(true);
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((data) => setChallenges(data.challenges ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadChallenges(); }, []);

  // Auto-open from ?new=1 (from command palette or empty-state CTA)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowModal(true);
      router.replace("/dashboard/challenges");
    }
  }, [searchParams, router]);

  const refreshShared = () => {
    loadChallenges();
    queryClient.invalidateQueries({ queryKey: ["challenges-list"] });
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error("Couldn't update challenge", "Please try again.");
        return;
      }
      toast.success(
        newStatus === "passed" ? "Marked as passed" :
        newStatus === "failed" ? "Marked as failed" :
        newStatus === "active" ? "Reactivated" : "Archived",
      );
      refreshShared();
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: number, firm: string) => {
    if (!confirm(`Delete ${firm} challenge? This cannot be undone.`)) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/challenges/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete", "Please try again.");
        return;
      }
      toast.success("Challenge deleted");
      refreshShared();
    } finally {
      setActingId(null);
    }
  };

  const filtered     = challenges.filter((c) =>
    tab === "active" ? c.status === "active" : c.status !== "active"
  );
  const activeCount    = challenges.filter((c) => c.status === "active").length;
  const completedCount = challenges.filter((c) => c.status !== "active").length;
  const firmCount      = new Set(challenges.map((c) => c.firm)).size;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showModal && (
        <NewChallengeModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadChallenges(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>My Challenges</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
            {loading ? "Loading…" : `${activeCount} active · ${firmCount} firm${firmCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New Challenge
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1F1F1F] p-1 rounded-lg w-fit">
        {(["active", "completed"] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
              tab === t ? "bg-[#2A2A2A] text-[#F1F1F1] shadow" : "text-[#666] hover:text-[#F1F1F1]"
            )}
          >
            {t}
            <span className="ml-2 text-xs opacity-60">
              ({t === "active" ? activeCount : completedCount})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <ChallengeCardsSkeleton count={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const color    = firmColor(c.firm);
              const profitPct = c.profitTarget > 0 ? (c.profitAchieved / c.profitTarget) * 100 : 0;
              const ddPct     = c.maxDrawdownLimit > 0 ? (c.maxDrawdown / c.maxDrawdownLimit) * 100 : 0;
              const isActive  = c.status === "active";
              const isActing  = actingId === c.id;
              return (
                <Card
                  key={c.id}
                  className={cn(
                    "relative overflow-hidden hover:border-white/10 transition-colors group",
                    !isActive && "opacity-70",
                    isActing && "opacity-40 pointer-events-none"
                  )}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold text-black" style={{ background: color }}>
                          {c.firm.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{c.firm}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{PHASE_LABELS[c.phase] ?? c.phase}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-right">
                          <Badge variant={STATUS_BADGE[c.status]?.variant ?? "secondary"}>
                            {STATUS_BADGE[c.status]?.label ?? c.status}
                          </Badge>
                          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>${c.accountSize.toLocaleString()}</p>
                        </div>
                        <ChallengeActionsMenu
                          challenge={c}
                          onStatus={(s) => handleUpdateStatus(c.id, s)}
                          onDelete={() => handleDelete(c.id, c.firm)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <TrendingUp className="h-3 w-3" /> Profit
                        </span>
                        <span className={cn("font-semibold", c.profitAchieved >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                          {c.hasLiveData ? `${c.profitAchieved.toFixed(1)}%` : "—"} / {c.profitTarget}%
                        </span>
                      </div>
                      <Progress value={Math.min(profitPct, 100)} className="h-1.5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <ShieldAlert className="h-3 w-3" /> Drawdown
                        </span>
                        <span className={cn("font-semibold", ddPct > 65 ? "text-[#F59E0B]" : "text-[#888]")}>
                          {c.hasLiveData ? `${c.maxDrawdown.toFixed(1)}%` : "—"} / {c.maxDrawdownLimit}%
                        </span>
                      </div>
                      <Progress value={Math.min(ddPct, 100)} className="h-1.5" indicatorClassName={ddPct > 65 ? "bg-[#F59E0B]" : "bg-[#555]"} />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                        <Calendar className="h-3 w-3" />
                        {c.startDate ? `Started ${c.startDate}` : "No start date"}
                      </div>
                      {isActive && c.daysLeft !== null && c.daysLeft > 0 && (
                        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{c.daysLeft}d left</span>
                      )}
                      {!isActive && (
                        <span className={cn("text-[11px] font-medium",
                          c.status === "passed" || c.status === "funded" ? "text-[#3B82F6]" : "text-[#EF4444]"
                        )}>
                          {c.status === "passed" || c.status === "funded" ? "✓ Passed" : "✗ Failed"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>
              <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No {tab} challenges yet.</p>
              {tab === "active" && (
                <Button variant="ghost" className="mt-3 gap-1" onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4" /> Add your first challenge
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Challenge actions dropdown ──────────────────────────────────────────────

function ChallengeActionsMenu({
  challenge,
  onStatus,
  onDelete,
}: {
  challenge: Challenge;
  onStatus: (newStatus: string) => void;
  onDelete: () => void;
}) {
  const isActive = challenge.status === "active";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Challenge actions"
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 hover:bg-white/5 transition-opacity"
          style={{ color: "var(--text-faint)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          align="end"
          className="z-50 min-w-[160px] rounded-lg shadow-xl py-1 animate-cmd-fade-in"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {isActive && (
            <>
              <MenuItem icon={CheckCircle2} label="Mark as passed" onSelect={() => onStatus("passed")} accent="#22C55E" />
              <MenuItem icon={XCircle} label="Mark as failed" onSelect={() => onStatus("failed")} accent="#EF4444" />
              <MenuItem icon={Archive} label="Archive" onSelect={() => onStatus("completed")} />
            </>
          )}
          {!isActive && (
            <MenuItem icon={CheckCircle2} label="Reactivate" onSelect={() => onStatus("active")} accent="#22C55E" />
          )}
          <DropdownMenu.Separator className="my-1 h-px" style={{ background: "var(--border)" }} />
          <MenuItem icon={Trash2} label="Delete" onSelect={onDelete} accent="#EF4444" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onSelect,
  accent,
}: {
  icon: typeof Trash2;
  label: string;
  onSelect: () => void;
  accent?: string;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer outline-none hover:bg-white/5"
      style={{ color: accent ?? "var(--text)" }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </DropdownMenu.Item>
  );
}
