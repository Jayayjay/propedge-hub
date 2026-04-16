"use client";

import { useState } from "react";
import { Bell, BellOff, CheckCheck, Filter, Mail, MessageSquare, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockAlerts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  warning: { icon: AlertTriangle, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/5 border-[#F59E0B]/15" },
  success: { icon: CheckCircle2, color: "text-[#22C55E]", bg: "bg-[#22C55E]/5 border-[#22C55E]/15" },
  info: { icon: Info, color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/5 border-[#3B82F6]/15" },
  critical: { icon: AlertTriangle, color: "text-[#EF4444]", bg: "bg-[#EF4444]/5 border-[#EF4444]/15" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const markAllRead = () => setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  const markRead = (id: number) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));

  const displayed = filter === "unread" ? alerts.filter((a) => !a.isRead) : alerts;
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F1F1F1]">Alerts Center</h1>
          <p className="text-sm text-[#555] mt-0.5">
            {unreadCount} unread · Stay ahead of rule breaches
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
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
            {emailEnabled ? (
              <Badge variant="default" className="text-[9px] h-4 px-1">ON</Badge>
            ) : (
              <Badge variant="secondary" className="text-[9px] h-4 px-1">OFF</Badge>
            )}
          </button>
          <button
            onClick={() => setWhatsappEnabled(!whatsappEnabled)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm transition-colors",
              whatsappEnabled
                ? "border-[#22C55E]/30 bg-[#22C55E]/5 text-[#22C55E]"
                : "border-white/8 bg-[#1A1A1A] text-[#666] hover:text-[#888]"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
            {whatsappEnabled ? (
              <Badge variant="default" className="text-[9px] h-4 px-1">ON</Badge>
            ) : (
              <Badge variant="secondary" className="text-[9px] h-4 px-1">OFF</Badge>
            )}
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
      <div className="space-y-2.5">
        {displayed.map((alert) => {
          const config = TYPE_CONFIG[alert.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              onClick={() => markRead(alert.id)}
              className={cn(
                "rounded-xl border p-4 cursor-pointer transition-all hover:border-white/15",
                alert.isRead ? "border-white/5 bg-transparent" : config.bg
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
                      <span className="text-[11px] text-[#555]">{alert.time}</span>
                      {!alert.isRead && (
                        <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#666] mt-0.5">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{alert.firm}</Badge>
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
          </div>
        )}
      </div>
    </div>
  );
}
