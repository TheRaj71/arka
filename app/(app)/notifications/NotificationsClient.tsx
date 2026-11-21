"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { formatIstDate, formatTimeAgo } from "@/lib/time";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  severity: "info" | "success" | "warning" | "action_required";
  link: string;
  read: boolean;
  created_at: string;
}

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n-1",
      kind: "delivery_confirmed",
      title: "Delivery Confirmed: Anita Sharma",
      body: "6x Panels & 3.3 kW Inverter delivered to rooftop. 20-year & 2-year warranty clocks started.",
      severity: "success",
      link: "/service",
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "n-2",
      kind: "order_confirmed",
      title: "Automation A6: Order ORD-2627-00001 Confirmed",
      body: "50% advance ₹92,500 received via HDFC UTR. Stock reserved and pick-list generated.",
      severity: "success",
      link: "/orders/o1111111-0000-0000-0000-000000000001",
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "n-3",
      kind: "survey_approved",
      title: "Hard Gate REQ-SURV-04 Passed: Survey Approved",
      body: "Site survey for PRJ-2627-00001 approved by Operations Manager. Quote engine unlocked.",
      severity: "action_required",
      link: "/surveys/s1111111-0000-0000-0000-000000000001",
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: "n-4",
      kind: "new_lead",
      title: "New Public Web Enquiry: Dr. Vikram Sen",
      body: "Inquiry for 3 kW On-Grid system with PM Surya Ghar subsidy in Aundh, Pune.",
      severity: "info",
      link: "/leads/d1111111-0000-0000-0000-000000000003",
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Realtime Notification Center
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            {notifications.filter((n) => !n.read).length} Unread
          </span>
        </div>

        <button
          onClick={markAllRead}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((n) => (
          <GlassCard
            key={n.id}
            className={`p-4 transition-all hover:border-amber-300 ${
              !n.read ? "bg-amber-50/30 border-amber-200/80" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    n.severity === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : n.severity === "action_required"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {n.severity === "success" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : n.severity === "action_required" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    {formatTimeAgo(n.created_at)}
                  </span>
                </div>
              </div>

              <Link
                href={n.link}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
