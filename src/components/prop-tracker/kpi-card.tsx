"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  status?: "safe" | "warning" | "danger";
  ring?: {
    value: number;
    max: number;
    color: string;
  };
  className?: string;
}

function RingProgress({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function KpiCard({ title, value, subValue, trend, status = "safe", ring, className }: KpiCardProps) {
  const valueColor = {
    safe: "var(--text)",
    warning: "#F59E0B",
    danger: "#EF4444",
  }[status];

  const accentColor = {
    safe: "rgba(255,255,255,0.15)",
    warning: "#F59E0B",
    danger: "#EF4444",
  }[status];

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: valueColor }}>
              {value}
            </p>
            {subValue && (
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{subValue}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-1.5">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-[#22C55E]" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-[#EF4444]" />
                )}
                <span className={cn("text-xs", trend >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                  {trend >= 0 ? "+" : ""}{trend.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          {ring && (
            <div className="relative shrink-0">
              <RingProgress value={ring.value} max={ring.max} color={ring.color} size={60} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                  {Math.round((ring.value / ring.max) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <div
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
        style={{ background: accentColor }}
      />
    </Card>
  );
}
