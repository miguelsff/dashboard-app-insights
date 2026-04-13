"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS } from "@/lib/chart-theme";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4"];

function OperationsBarChartSkeleton() {
  return (
    <div className="card h-full">
      <div className="skeleton h-3 w-44 rounded mb-5" />
      <div className="space-y-4 px-2 pt-2">
        {[72, 90, 55].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-3 w-32 rounded flex-shrink-0" />
            <div className="skeleton h-6 rounded" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OperationsBarChart() {
  const { requestsByOperation, isLoading } = useTelemetry();

  if (isLoading) return <OperationsBarChartSkeleton />;

  return (
    <div className="card h-full">
      <p className="card-title">Requests by Operation</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={requestsByOperation}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} {...AXIS_BASE} allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={160} tick={AXIS_TICK} {...AXIS_BASE} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, "requests"]} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {requestsByOperation.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
