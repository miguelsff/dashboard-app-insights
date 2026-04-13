"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS } from "@/lib/chart-theme";

function RequestTimelineSkeleton() {
  const points = [35, 55, 40, 70, 45, 80, 60, 90, 50, 65];
  const max = 90;
  const w = 100 / (points.length - 1);
  const pts = points.map((y, i) => `${i * w},${100 - (y / max) * 80}`).join(' ');
  return (
    <div className="card h-full">
      <div className="skeleton h-3 w-56 rounded mb-5" />
      <div className="relative px-2 pt-2" style={{ height: 260 }}>
        <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="skGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${pts} ${100},100 0,100`} fill="url(#skGrad)" />
          <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
        <div className="absolute inset-0 skeleton rounded opacity-30" />
      </div>
    </div>
  );
}

export default function RequestTimeline() {
  const { timelineData, isLoading } = useTelemetry();

  if (isLoading) return <RequestTimelineSkeleton />;

  return (
    <div className="card h-full">
      <p className="card-title">Request Timeline (by UTC minute)</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={timelineData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="minute" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} allowDecimals={false} width={24} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, "requests"]} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#areaGrad)"
            dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#60a5fa" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
