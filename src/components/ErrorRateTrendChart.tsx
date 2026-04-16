"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { AXIS_BASE, AXIS_TICK, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chart-theme";

function formatHourLabel(hour: string) {
  return hour.slice(11, 13) + ":00";
}

export default function ErrorRateTrendChart() {
  const { errorRateTrendData, isLoading } = useTelemetry();

  if (isLoading) {
    return (
      <div className="card">
        <p className="card-title mb-4">Error Rate Trend</p>
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  if (errorRateTrendData.length === 0) {
    return (
      <div className="card">
        <p className="card-title mb-4">Error Rate Trend</p>
        <p className="text-sm text-gray-500 text-center py-12">No data in this period.</p>
      </div>
    );
  }

  const data = errorRateTrendData.map((d) => ({
    label: formatHourLabel(d.hour),
    errorRate: d.errorRate,
  }));

  return (
    <div className="card">
      <p className="card-title mb-4">Error Rate Trend (hourly %)</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} unit="%" domain={[0, 'auto']} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v) => [`${v}%`, 'Error Rate']}
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="errorRate"
            name="Error Rate"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ef4444' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
