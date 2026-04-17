"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import {
  Plus, BookOpen, TrendingUp, TrendingDown, Trash2, X,
  ChevronDown, ChevronUp, Pencil,
} from "lucide-react";
import { format } from "date-fns";

interface JournalEntry {
  id: number;
  date: string;
  symbol: string | null;
  direction: string | null;
  setup: string | null;
  notes: string | null;
  outcome: string | null;
  pnl: string | null;
  mood: string | null;
  tags: string[] | null;
  isWin: boolean | null;
  createdAt: string;
}

const MOODS = ["confident", "neutral", "anxious", "greedy", "fearful"] as const;
const MOOD_COLORS: Record<string, string> = {
  confident: "text-[#22C55E]",
  neutral: "text-[#888]",
  anxious: "text-[#F59E0B]",
  greedy: "text-[#EC4899]",
  fearful: "text-[#EF4444]",
};

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  symbol: "",
  direction: "none",
  setup: "",
  notes: "",
  outcome: "",
  pnl: "",
  mood: "neutral",
  tags: "",
  isWin: "",
};

type FormState = typeof emptyForm;

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function openNew() {
    setEditEntry(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(entry: JournalEntry) {
    setEditEntry(entry);
    setForm({
      date: entry.date ? entry.date.split("T")[0] : emptyForm.date,
      symbol: entry.symbol ?? "",
      direction: entry.direction ?? "none",
      setup: entry.setup ?? "",
      notes: entry.notes ?? "",
      outcome: entry.outcome ?? "",
      pnl: entry.pnl ?? "",
      mood: entry.mood ?? "neutral",
      tags: entry.tags?.join(", ") ?? "",
      isWin: entry.isWin === true ? "true" : entry.isWin === false ? "false" : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        symbol: form.symbol || null,
        direction: form.direction,
        setup: form.setup || null,
        notes: form.notes || null,
        outcome: form.outcome || null,
        pnl: form.pnl ? parseFloat(form.pnl) : null,
        mood: form.mood || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        isWin: form.isWin === "true" ? true : form.isWin === "false" ? false : null,
      };

      const url = editEntry ? `/api/journal/${editEntry.id}` : "/api/journal";
      const method = editEntry ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        await fetchEntries();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const wins = entries.filter((e) => e.isWin === true).length;
  const losses = entries.filter((e) => e.isWin === false).length;
  const total = entries.length;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
  const netPnl = entries.reduce((sum, e) => sum + (parseFloat(e.pnl ?? "0") || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Trading Journal</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>Log trades, document setups, track your mindset</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-black">
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: total },
          { label: "Win Rate", value: `${winRate}%` },
          { label: "Net P&L", value: `${netPnl >= 0 ? "+" : ""}$${netPnl.toFixed(2)}`, colored: true, positive: netPnl >= 0 },
          { label: "Wins / Losses", value: `${wins} / ${losses}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{s.label}</p>
              <p className={cn("text-xl font-bold mt-1", s.colored ? (s.positive ? "text-[#22C55E]" : "text-[#EF4444]") : "")}
                style={!s.colored ? { color: "var(--text)" } : {}}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#22C55E]" />
            Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm" style={{ color: "var(--text-faint)" }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: "var(--text)" }} />
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>No entries yet. Start logging your trades.</p>
              <Button onClick={openNew} variant="outline" size="sm" className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> New Entry
              </Button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {entries.map((entry) => {
                const pnlNum = parseFloat(entry.pnl ?? "0") || 0;
                const isExpanded = expandedId === entry.id;
                return (
                  <div key={entry.id} className="px-5 py-4">
                    {/* Row */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                      {/* Win/Loss indicator */}
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        entry.isWin === true ? "bg-[#22C55E]/15" : entry.isWin === false ? "bg-[#EF4444]/15" : "bg-white/5",
                      )}>
                        {entry.isWin === true
                          ? <TrendingUp className="h-4 w-4 text-[#22C55E]" />
                          : entry.isWin === false
                          ? <TrendingDown className="h-4 w-4 text-[#EF4444]" />
                          : <BookOpen className="h-4 w-4" style={{ color: "var(--text-faint)" }} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.symbol && (
                            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{entry.symbol}</span>
                          )}
                          {entry.direction && entry.direction !== "none" && (
                            <Badge variant={entry.direction === "buy" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                              {entry.direction.toUpperCase()}
                            </Badge>
                          )}
                          {entry.mood && (
                            <span className={cn("text-xs capitalize", MOOD_COLORS[entry.mood] ?? "text-[#888]")}>
                              {entry.mood}
                            </span>
                          )}
                          {entry.tags?.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        {entry.setup && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{entry.setup}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {entry.pnl && (
                          <p className={cn("font-semibold text-sm", pnlNum >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                            {pnlNum >= 0 ? "+" : ""}${pnlNum.toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {entry.date ? format(new Date(entry.date), "dd MMM yyyy") : ""}
                        </p>
                      </div>

                      <div className="ml-2">
                        {isExpanded ? <ChevronUp className="h-4 w-4" style={{ color: "var(--text-faint)" }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--text-faint)" }} />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pl-11 space-y-3">
                        {entry.notes && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>Notes</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{entry.notes}</p>
                          </div>
                        )}
                        {entry.outcome && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>Outcome</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{entry.outcome}</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => openEdit(entry)}>
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs text-[#EF4444] hover:text-[#EF4444]" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New / Edit Entry Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {editEntry ? "Edit Entry" : "New Journal Entry"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 rounded-lg hover:bg-white/5" style={{ color: "var(--text-faint)" }}>
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Date + Symbol row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Symbol</Label>
                  <Input
                    placeholder="e.g. EURUSD"
                    value={form.symbol}
                    onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Direction + Result row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Direction</Label>
                  <SelectField
                    value={form.direction}
                    onChange={(v) => setForm((f) => ({ ...f, direction: v }))}
                    options={[{ value: "none", label: "None" }, { value: "buy", label: "Buy" }, { value: "sell", label: "Sell" }]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Result</Label>
                  <SelectField
                    value={form.isWin}
                    onChange={(v) => setForm((f) => ({ ...f, isWin: v }))}
                    options={[{ value: "", label: "—" }, { value: "true", label: "Win" }, { value: "false", label: "Loss" }]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: "var(--text-muted)" }}>P&L ($)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 120.50"
                    value={form.pnl}
                    onChange={(e) => setForm((f) => ({ ...f, pnl: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Mood */}
              <div className="space-y-1.5">
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Mood</Label>
                <SelectField
                  value={form.mood}
                  onChange={(v) => setForm((f) => ({ ...f, mood: v }))}
                  options={MOODS.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
                />
              </div>

              {/* Setup */}
              <div className="space-y-1.5">
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Setup / Reason</Label>
                <textarea
                  placeholder="What setup or signal triggered this trade?"
                  value={form.setup}
                  onChange={(e) => setForm((f) => ({ ...f, setup: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Notes</Label>
                <textarea
                  placeholder="Thoughts during the trade, what you observed…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Outcome */}
              <div className="space-y-1.5">
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Outcome / Lessons</Label>
                <textarea
                  placeholder="What happened? What would you do differently?"
                  value={form.outcome}
                  onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="text-xs" style={{ color: "var(--text-muted)" }}>Tags (comma-separated)</Label>
                <Input
                  placeholder="e.g. breakout, London session, FOMO"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <Dialog.Close asChild>
                <Button variant="outline" className="flex-1" disabled={saving}>Cancel</Button>
              </Dialog.Close>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-black"
              >
                {saving ? "Saving…" : editEntry ? "Update Entry" : "Save Entry"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function SelectField({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        className="flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        <Select.Value />
        <Select.Icon><ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-[100] rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport>
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex items-center px-3 py-2 text-sm cursor-pointer outline-none hover:bg-white/5"
                style={{ color: "var(--text)" }}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
