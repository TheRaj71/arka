"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface DashboardChartsProps {
  curveData: Array<{ time: string; outputKw: number }>;
}

export function DashboardCharts({ curveData }: DashboardChartsProps) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={curveData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="energyCurve" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val} kW`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
              fontSize: "11px",
              fontWeight: 600,
            }}
            formatter={(value: any) => [`${value} kW`, "Solar Power"]}
          />
          <Area
            type="monotone"
            dataKey="outputKw"
            stroke="#0284c7"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#energyCurve)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
