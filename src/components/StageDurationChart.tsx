"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";

export default function StageDurationChart() {
  const { stageDurationData, isLoading } = useTelemetry();

  if (isLoading) {
    return <div className="card"><div className="skeleton h-64 rounded-lg" /></div>;
  }

  if (stageDurationData.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Duración Promedio por Etapa</h3>
        <p className="text-sm text-gray-500">No data in this period</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title">Duración Promedio por Etapa del Pipeline</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={stageDurationData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 120 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis type="number" tick={AXIS_TICK} {...AXIS_BASE} tickFormatter={(v: number) => formatDuration(v)} />
          <YAxis type="category" dataKey="stage" tick={AXIS_TICK} {...AXIS_BASE} width={110} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [formatDuration(Number(value)), "Avg Duration"]}
          />
          <Bar dataKey="avgDurationMs" fill="#60a5fa" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
