"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS } from "@/lib/chart-theme";

const BUCKET_COLORS: Record<string, string> = {
  "<250ms": "#10b981",
  "250ms-500ms": "#f59e0b",
  "500ms-1sec": "#f97316",
  "1sec-3sec": "#f97316",
  "3sec-7sec": "#f97316",
  "7sec-15sec": "#ef4444",
  "15sec-30sec": "#dc2626",
  "30sec-1min": "#dc2626",
  ">=1min": "#991b1b",
  ">=5min": "#991b1b",
};

function PerformanceBucketChartSkeleton() {
  const bars = [30, 45, 60, 80, 55, 70, 40, 90];
  return (
    <div className="card h-full">
      <div className="skeleton h-3 w-52 rounded mb-5" />
      <div className="flex items-end gap-2 px-2 pt-2" style={{ height: 240 }}>
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-1">
            <div className="skeleton rounded-t" style={{ height: `${h}%` }} />
            <div className="skeleton h-2 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PerformanceBucketChart() {
  const { requestsByBucket, isLoading } = useTelemetry();

  if (isLoading) return <PerformanceBucketChartSkeleton />;

  return (
    <div className="card h-full">
      <p className="card-title">Performance Bucket Distribution</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={requestsByBucket} margin={{ top: 4, right: 16, bottom: 60, left: 0 }}>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            {...AXIS_BASE}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} allowDecimals={false} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, "requests"]} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {requestsByBucket.map((entry) => (
              <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? "#3b82f6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
