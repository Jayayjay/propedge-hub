"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { EquityPoint } from "@/hooks/use-live-data";
import { Loader2, Wifi } from "lucide-react";

interface Props {
  data:            EquityPoint[];
  startingBalance: number;
  isLive?:         boolean;
  isLoading?:      boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-3 py-2.5 shadow-xl text-xs"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <p className="mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="font-bold text-[#22C55E]">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function EquityChart({ data, startingBalance, isLive = false, isLoading = false }: Props) {
  const currentEquity = data[data.length - 1]?.equity ?? startingBalance;
  const profitLoss    = currentEquity - startingBalance;
  const isProfit      = profitLoss >= 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            Equity Curve
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] text-[#22C55E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse inline-block" />
                Live
              </span>
            )}
          </CardTitle>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>
            {isLoading
              ? <Loader2 className="h-5 w-5 animate-spin inline text-[#22C55E]" />
              : formatCurrency(currentEquity)
            }
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-semibold ${isProfit ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
            {isProfit ? "+" : ""}{formatCurrency(profitLoss)}
          </span>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            vs starting balance
          </p>
        </div>
      </CardHeader>

      <CardContent className="pb-4 pt-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(128,128,128,0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-faint)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tick={{ fill: "var(--text-faint)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={42}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={startingBalance}
              stroke="rgba(128,128,128,0.2)"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#22C55E", stroke: "#0A0A0A", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
