"use client";

import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, ResponsiveContainer,
} from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { AXIS_BASE, AXIS_TICK, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chart-theme";

function formatHourLabel(hour: string) {
  // hour format: "2026-04-15T14"
  return hour.slice(11, 13) + ":00";
}

export default function TraceTimelineChart() {
  const { traceTimelineData, isLoading } = useTelemetry();

  if (isLoading) {
    return (
      <div className="card">
        <p className="card-title mb-4">Trace Volume</p>
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  if (traceTimelineData.length === 0) {
    return (
      <div className="card">
        <p className="card-title mb-4">Trace Volume</p>
        <p className="text-sm text-gray-500 text-center py-12">No traces in this period.</p>
      </div>
    );
  }

  const data = traceTimelineData.map((d) => ({
    ...d,
    label: formatHourLabel(d.hour),
    successful: d.count - d.failures,
  }));

  return (
    <div className="card">
      <p className="card-title mb-4">Trace Volume (hourly)</p>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [value, name === 'successful' ? 'Successful' : name === 'failures' ? 'Failed' : name]}
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Area type="monotone" dataKey="successful" name="Successful" stackId="1"
            stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
          <Area type="monotone" dataKey="failures" name="Failed" stackId="1"
            stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
