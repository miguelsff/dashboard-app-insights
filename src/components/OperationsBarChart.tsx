"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { requestsByOperation } from "@/data/telemetry";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS } from "@/lib/chart-theme";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4"];

export default function OperationsBarChart() {
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
