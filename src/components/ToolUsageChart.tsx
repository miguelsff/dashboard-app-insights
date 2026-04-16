"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { AXIS_BASE, AXIS_TICK, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";

export default function ToolUsageChart() {
  const { toolUsageData, isLoading } = useTelemetry();

  if (isLoading) {
    return (
      <div className="card">
        <p className="card-title mb-4">Tool Usage</p>
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  if (toolUsageData.length === 0) {
    return (
      <div className="card">
        <p className="card-title mb-4">Tool Usage</p>
        <p className="text-sm text-gray-500 text-center py-12">No tool spans detected.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="card-title mb-4">Tool Usage (top 10)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={toolUsageData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis
            type="category"
            dataKey="tool"
            tick={AXIS_TICK}
            {...AXIS_BASE}
            width={120}
            tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [
              name === 'count' ? value : formatDuration(Number(value)),
              name === 'count' ? 'Calls' : 'Avg Duration',
            ]}
          />
          <Bar dataKey="count" name="count" fill="#22d3ee" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
