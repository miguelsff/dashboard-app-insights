"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS } from "@/lib/chart-theme";

export default function TokensByDayChart() {
  const { tokensByDayData, isLoading } = useTelemetry();

  if (isLoading) {
    return <div className="card"><div className="skeleton h-64 rounded-lg" /></div>;
  }

  if (tokensByDayData.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Tokens por Día</h3>
        <p className="text-sm text-gray-500">No data in this period</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title">Tokens por Día (Input vs Output)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={tokensByDayData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="day" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} tickFormatter={(v: number) => v.toLocaleString()} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [Number(value).toLocaleString(), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
          <Area
            type="monotone"
            dataKey="inputTokens"
            name="Input Tokens"
            stackId="1"
            stroke={VISTA1_COLORS.inputTokens}
            fill={VISTA1_COLORS.inputTokens}
            fillOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="outputTokens"
            name="Output Tokens"
            stackId="1"
            stroke={VISTA1_COLORS.outputTokens}
            fill={VISTA1_COLORS.outputTokens}
            fillOpacity={0.4}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
