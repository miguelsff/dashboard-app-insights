"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { TOOLTIP_STYLE } from "@/lib/chart-theme";

const COLORS = ["#10b981", "#ef4444"];

export default function SuccessFailurePieChart() {
  const { successFailureData, totalRequests, successRate } = useTelemetry();

  return (
    <div className="card h-full flex flex-col">
      <p className="card-title">Success vs Failure</p>
      <div className="relative flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={successFailureData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
            >
              {successFailureData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[successFailureData.indexOf(entry)]} />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v, name) => [
                `${v} (${((Number(v) / totalRequests) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "#9ca3af", fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-9">
          <span className="text-2xl font-bold text-emerald-400">{successRate}%</span>
          <span className="text-xs text-gray-500 mt-0.5">success</span>
        </div>
      </div>
    </div>
  );
}
