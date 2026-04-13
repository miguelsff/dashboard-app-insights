"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { TOOLTIP_STYLE } from "@/lib/chart-theme";

const COLORS = ["#10b981", "#ef4444"];

function SuccessFailurePieChartSkeleton() {
  return (
    <div className="card h-full flex flex-col">
      <div className="skeleton h-3 w-36 rounded mb-5" />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
        <div className="relative">
          <div className="skeleton w-44 h-44 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-surface-800" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function SuccessFailurePieChart() {
  const { successFailureData, totalRequests, successRate, isLoading } = useTelemetry();

  if (isLoading) return <SuccessFailurePieChartSkeleton />;

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
