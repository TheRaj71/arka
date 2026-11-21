"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface DashboardChartsProps {
  curveData: Array<{ time: string; outputKw: number }>;
}

export function DashboardCharts({ curveData }: DashboardChartsProps) {
  return (
    <div className="w-full h-full min-h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis
            dataKey="time"
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "var(--border-subtle)" }}
            dy={8}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val} kW`}
            dx={-4}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-strong)",
              boxShadow: "var(--shadow-dropdown)",
              color: "var(--text-primary)",
              fontSize: "13px",
              padding: "8px 12px",
            }}
            formatter={(value: any) => [`${value} kW`, "Generation"]}
            labelStyle={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="outputKw"
            stroke="#0F766E"
            strokeWidth={2}
            fill="#0F766E"
            fillOpacity={0.08}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
