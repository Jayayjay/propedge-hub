"use client";

import { useEffect, useState } from "react";
import { CreditCard, Plug, Shield, User, Trash2, Plus, CheckCircle2, Zap, Loader2, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["1 active challenge", "Basic tracking", "Email alerts"],
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$10",
    period: "/ month",
    features: ["Unlimited challenges", "Live MT5 sync", "WhatsApp alerts", "PDF reports", "Priority support"],
    current: false,
    popular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "$17",
    period: "/ month",
    features: ["Everything in Pro", "Multi-account copier", "Advanced analytics", "API access", "Dedicated support"],
    current: false,
  },
];

const mt5Accounts = [
  { id: 1, label: "FTUK Phase 2", server: "MetaQuotes-Demo", accountNo: "***4521", status: "connected" },
  { id: 2, label: "FunderPro P1", server: "FP-Server-01", accountNo: "***8812", status: "connected" },
];

export default function SettingsPage() {
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [showMT5Form, setShowMT5Form] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Profile / notification state
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileSaved, setProfileSaved]     = useState(false);

  useEffect(() => {
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.name)           setName(d.name);
        if (d.email)          setEmail(d.email);
        if (d.whatsappNumber) setWhatsappNumber(d.whatsappNumber);
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await fetch("/api/user/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name,
          whatsappNumber: whatsappNumber.trim() || null,
        }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // keep button enabled on error
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#F1F1F1]">Settings</h1>
        <p className="text-sm text-[#555] mt-0.5">Manage your subscription, accounts, and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#555]" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                disabled
                className="opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="gap-1.5"
          >
            {profileSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {profileSaved ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#555]" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <div className="flex gap-2">
              <Input
                placeholder="+2348012345678"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="gap-1.5 shrink-0"
              >
                {profileSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {profileSaved ? "Saved!" : "Save"}
              </Button>
            </div>
            <p className="text-[11px] text-[#555]">
              Include country code, e.g. +234… · Critical and breach alerts will be sent here via WhatsApp.
            </p>
          </div>

          <div className="rounded-lg border border-white/6 bg-[#1A1A1A] p-3 space-y-1.5">
            <p className="text-xs font-medium text-[#888]">Alert channels</p>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-xs text-[#22C55E]">
                <CheckCircle2 className="h-3 w-3" /> Email (always on)
              </span>
              <span className={`flex items-center gap-1.5 text-xs ${whatsappNumber ? "text-[#22C55E]" : "text-[#555]"}`}>
                <MessageCircle className="h-3 w-3" />
                WhatsApp {whatsappNumber ? "enabled" : "— add number above"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#555]" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-[#2A2A2A]">
            <Badge variant="default">Free Plan</Badge>
            <span className="text-sm text-[#888]">Upgrade to unlock all features</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all ${
                  plan.current || selectedPlan === plan.id
                    ? "border-[#22C55E]/40 bg-[#22C55E]/5"
                    : "border-white/8 hover:border-white/15"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#22C55E] text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Popular
                  </div>
                )}
                <div className="space-y-1 mb-3">
                  <p className="text-sm font-bold text-[#F1F1F1]">{plan.name}</p>
                  <p className="text-lg font-bold text-[#22C55E]">
                    {plan.price}
                    <span className="text-xs text-[#666] font-normal ml-1">{plan.period}</span>
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-[#888]">
                      <CheckCircle2 className="h-3 w-3 text-[#22C55E] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <Button
                    size="sm"
                    className="w-full mt-4 gap-1.5"
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    onClick={(e) => { e.stopPropagation(); handleUpgrade(plan.id); }}
                    disabled={upgrading === plan.id}
                  >
                    {upgrading === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    Upgrade to {plan.name}
                  </Button>
                )}
                {plan.current && (
                  <div className="mt-4 text-center text-xs text-[#22C55E] font-medium">✓ Current Plan</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MT5 Accounts */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-[#555]" />
            MT5 Accounts
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowMT5Form(!showMT5Form)}>
            <Plus className="h-3.5 w-3.5" />
            Connect MT5
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mt5Accounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#2A2A2A]">
              <div className="h-8 w-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Plug className="h-3.5 w-3.5 text-[#22C55E]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F1F1F1]">{acc.label}</p>
                <p className="text-xs text-[#555]">{acc.server} · {acc.accountNo}</p>
              </div>
              <Badge variant="default" className="text-[10px]">Connected</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#555] hover:text-[#EF4444]">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {showMT5Form && (
            <div className="mt-4 space-y-3 rounded-xl border border-white/8 p-4">
              <p className="text-sm font-semibold text-[#F1F1F1]">Connect New MT5 Account</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input placeholder="e.g. FTUK Phase 1" />
                </div>
                <div className="space-y-1">
                  <Label>Account Number</Label>
                  <Input placeholder="12345678" />
                </div>
                <div className="space-y-1">
                  <Label>Server</Label>
                  <Input placeholder="e.g. MetaQuotes-Demo" />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Investor password" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5">
                  <Plug className="h-3.5 w-3.5" />
                  Connect
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowMT5Form(false)}>Cancel</Button>
              </div>
              <p className="text-[11px] text-[#555]">
                * Only investor (read-only) password required. We cannot place trades on your behalf.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#555]" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#F1F1F1]">Two-Factor Authentication</p>
              <p className="text-xs text-[#555]">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">Enable 2FA</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#EF4444]">Delete Account</p>
              <p className="text-xs text-[#555]">Permanently remove your account and data</p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
