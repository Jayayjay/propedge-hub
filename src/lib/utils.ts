import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, showSign = true): string {
  const formatted = Math.abs(value).toFixed(2) + "%";
  if (!showSign) return formatted;
  if (value > 0) return "+" + formatted;
  if (value < 0) return "-" + formatted;
  return formatted;
}

export function getRiskColor(value: number, limit: number): string {
  const ratio = value / limit;
  if (ratio >= 0.85) return "#EF4444"; // critical
  if (ratio >= 0.65) return "#F59E0B"; // warning
  return "#22C55E"; // safe
}
