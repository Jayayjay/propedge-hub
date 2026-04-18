"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell, BellOff, CheckCheck, Mail, MessageSquare,
  AlertTriangle, CheckCircle2, Info, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AlertSeverity = "info" | "warning" | "critical";
type AlertType = "daily_drawdown" | "max_drawdown" | "profit_target" | "breach";

type Alert = {
  id: number;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  isRead: boolean;
  channels: string[] | null;
  createdAt: string;
  firm: string | null;
};

function uiType(a: Alert): "warning" | "success" | "info" | "critical" {
  if (a.severity === "critical" || a.type === "breach") return "critical";
  if (a.type === "profit_target") return "success";
  if (a.severity === "warning") return "warning";
  return "info";
}

const TYPE_CONFIG = {
  warning:  { icon: AlertTriangle,  color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/5 border-[#F59E0B]/15" },
  success:  { icon: CheckCircle2,   color: "text-[#22C55E]", bg: "bg-[#22C55E]/5 border-[#22C55E]/15" },
  info:     { icon: Info,            color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/5 border-[#3B82F6]/15" },
  critical: { icon: AlertTriangle,  color: "text-[#EF4444]", bg: "bg-[#EF4444]/5 border-[#EF4444]/15" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("alerts_whatsapp") === "true";
    }
    return false;
  });

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) setAlerts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const toggleWhatsapp = () => {
    const next = !whatsappEnabled;
    setWhatsappEnabled(next);
    localStorage.setItem("alerts_whatsapp", String(next));
  };

  const markRead = async (id: number) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
  };

  const markAllRead = async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    await fetch("/api/alerts/read-all", { method: "POST" });
  };

  const displayed = filter === "unread" ? alerts.filter((a) => !a.isRead) : alerts;
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Alerts Center</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
            {loading ? "Loading…" : `${unreadCount} unread · Stay ahead of rule breaches`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2" disabled={unreadCount === 0}>
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </Button>
      </div>

      {/* Notification channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <button
            onClick={() => setEmailEnabled(!emailEnabled)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm transition-colors",
              emailEnabled
                ? "border-[#22C55E]/30 bg-[#22C55E]/5 text-[#22C55E]"
                : "border-white/8 bg-[#1A1A1A] text-[#666] hover:text-[#888]"
            )}
          >
            <Mail className="h-4 w-4" />
            Email
            <Badge variant={emailEnabled ? "default" : "secondary"} className="text-[9px] h-4 px-1">
              {emailEnabled ? "ON" : "OFF"}
            </Badge>
          </button>
          <button
            onClick={toggleWhatsapp}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm transition-colors",
              whatsappEnabled
                ? "border-[#22C55E]/30 bg-[#22C55E]/5 text-[#22C55E]"
                : "border-white/8 bg-[#1A1A1A] text-[#666] hover:text-[#888]"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
            <Badge variant={whatsappEnabled ? "default" : "secondary"} className="text-[9px] h-4 px-1">
              {whatsappEnabled ? "ON" : "OFF"}
            </Badge>
          </button>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-1 bg-[#1F1F1F] p-1 rounded-lg w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
              filter === f
                ? "bg-[#2A2A2A] text-[#F1F1F1] shadow"
                : "text-[#666] hover:text-[#F1F1F1]"
            )}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#EF4444]/20 text-[#EF4444] px-1.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#555]" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((alert) => {
            const t = uiType(alert);
            const config = TYPE_CONFIG[t];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                onClick={() => !alert.isRead && markRead(alert.id)}
                className={cn(
                  "rounded-xl border p-4 transition-all hover:border-white/15",
                  alert.isRead ? "border-white/5 bg-transparent" : cn("cursor-pointer", config.bg)
                )}
              >
                <div className="flex gap-3">
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", alert.isRead ? "text-[#555]" : config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-semibold", alert.isRead ? "text-[#888]" : "text-[#F1F1F1]")}>
                        {alert.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#555]">{timeAgo(alert.createdAt)}</span>
                        {!alert.isRead && <div className="h-2 w-2 rounded-full bg-[#22C55E]" />}
                      </div>
                    </div>
                    <p className="text-xs text-[#666] mt-0.5">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {alert.firm && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{alert.firm}</Badge>
                      )}
                      {alert.channels?.map((ch) => (
                        <span key={ch} className="text-[10px] text-[#444]">via {ch}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {displayed.length === 0 && (
            <div className="text-center py-16">
              <BellOff className="h-10 w-10 mx-auto mb-3 text-[#333]" />
              <p className="text-sm text-[#555]">No {filter === "unread" ? "unread " : ""}alerts</p>
              {alerts.length === 0 && (
                <p className="text-xs text-[#444] mt-1">Alerts appear when the MT5 bridge detects rule breaches</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
