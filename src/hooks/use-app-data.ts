"use client";

import { useQuery } from "@tanstack/react-query";

export interface ChallengeSummary {
  id: number;
  firm: string;
  phase: string;
  accountSize: number;
  status: string;
  hasLiveData: boolean;
}

export interface UserSettings {
  name: string | null;
  email: string;
  whatsappNumber: string | null;
  emailAlertsEnabled: boolean;
  whatsappAlertsEnabled: boolean;
  plan: string;
  currentPeriodEnd: string | null;
}

async function fetchChallenges(): Promise<ChallengeSummary[]> {
  const res = await fetch("/api/challenges");
  if (!res.ok) return [];
  const data = await res.json();
  return data.challenges ?? [];
}

async function fetchAlertsCount(): Promise<{ total: number; unread: number }> {
  const res = await fetch("/api/alerts");
  if (!res.ok) return { total: 0, unread: 0 };
  const rows = await res.json();
  const unread = Array.isArray(rows) ? rows.filter((a: { isRead: boolean }) => !a.isRead).length : 0;
  const total = Array.isArray(rows) ? rows.length : 0;
  return { total, unread };
}

async function fetchSettings(): Promise<UserSettings | null> {
  const res = await fetch("/api/user/settings");
  if (!res.ok) return null;
  return res.json();
}

export function useChallengesList() {
  return useQuery<ChallengeSummary[]>({
    queryKey: ["challenges-list"],
    queryFn: fetchChallenges,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useAlertsCount() {
  return useQuery({
    queryKey: ["alerts-count"],
    queryFn: fetchAlertsCount,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useUserSettings() {
  return useQuery<UserSettings | null>({
    queryKey: ["user-settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
}
