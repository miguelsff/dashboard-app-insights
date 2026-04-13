"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { timelineData } from "@/data/telemetry";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS } from "@/lib/chart-theme";

export default function RequestTimeline() {
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
