"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIstDate } from "@/lib/time";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Wrench,
  Compass,
  Zap,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface ScheduleJob {
  id: string;
  job_no: string;
  type: "survey" | "install" | "service";
  status: string;
  title: string;
  customerName: string;
  siteAddress: string;
  timeSlot: string;
  technicianName: string;
  technicianRole: string;
  link: string;
}

export function ScheduleClient() {
  const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow" | "later">("today");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");

  const demoJobs: ScheduleJob[] = [
    {
      id: "j1",
      job_no: "JOB-2627-00001",
      type: "survey",
      status: "completed",
      title: "Rooftop Solar Survey - 3 kW On-Grid",
      customerName: "Anita Sharma",
      siteAddress: "Plot 14, Lotus Park, Baner, Pune",
      timeSlot: "10:00 AM - 11:30 AM",
      technicianName: "Imran Khan",
      technicianRole: "Lead Field Technician",
      link: "/surveys/s1111111-0000-0000-0000-000000000001",
    },
    {
      id: "j2",
      job_no: "JOB-2627-00002",
      type: "survey",
      status: "scheduled",
      title: "Dairy Farm 5 kW Off-Grid Survey",
      customerName: "Suresh Patil",
      siteAddress: "Greenfield Dairy, Shikrapur Rd, Pune",
      timeSlot: "02:00 PM - 03:30 PM",
      technicianName: "Vikram Patel",
      technicianRole: "Field Technician",
      link: "/surveys/s1111111-0000-0000-0000-000000000002",
    },
    {
      id: "j3",
      job_no: "JOB-2627-00003",
      type: "install",
      status: "scheduled",
      title: "Installation & Inverter Mounting (3 kW)",
      customerName: "Dr. Vikram Sen",
      siteAddress: "Bungalow 7, Sindh Society, Aundh, Pune",
      timeSlot: "09:00 AM - 04:00 PM",
      technicianName: "Imran Khan",
      technicianRole: "Lead Field Technician",
      link: "/field",
    },
  ];

  const filteredJobs = demoJobs.filter((job) => {
    if (jobTypeFilter !== "all" && job.type !== jobTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Technician Schedule & Dispatch
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              15 Technicians Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realtime dispatch calendar for rooftop site audits, solar panel installations, and warranty service calls.
          </p>
        </div>

        {/* Date Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white/80 border border-slate-200/80 rounded-xl shadow-sm text-xs font-semibold">
          {[
            { id: "today", label: "Today" },
            { id: "tomorrow", label: "Tomorrow" },
            { id: "later", label: "This Week" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDay === d.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Job Type:</span>
            </span>
            {[
              { id: "all", label: "All Dispatches" },
              { id: "survey", label: "Site Surveys" },
              { id: "install", label: "Installations" },
              { id: "service", label: "Service Tickets" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setJobTypeFilter(f.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  jobTypeFilter === f.id
                    ? "bg-amber-500 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {filteredJobs.length} Assigned Jobs
          </div>
        </div>
      </GlassCard>

      {/* Technician Roster Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imran Khan Lane */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                IK
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Imran Khan</h3>
                <span className="text-[10px] text-slate-500">Lead Technician • West Pune</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              On Duty
            </span>
          </div>

          <div className="space-y-3">
            {filteredJobs
              .filter((j) => j.technicianName === "Imran Khan")
              .map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all text-xs space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold block">
                        {job.job_no}
                      </span>
                      <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        {job.title}
                      </h4>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{job.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{job.siteAddress}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {job.type}
                    </span>
                    <Link
                      href={job.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      <span>View Job</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </GlassCard>

        {/* Vikram Patel Lane */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-sm">
                VP
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Vikram Patel</h3>
                <span className="text-[10px] text-slate-500">Field Technician • East Pune</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              On Duty
            </span>
          </div>

          <div className="space-y-3">
            {filteredJobs
              .filter((j) => j.technicianName === "Vikram Patel")
              .map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all text-xs space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold block">
                        {job.job_no}
                      </span>
                      <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        {job.title}
                      </h4>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{job.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{job.siteAddress}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {job.type}
                    </span>
                    <Link
                      href={job.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      <span>View Job</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
