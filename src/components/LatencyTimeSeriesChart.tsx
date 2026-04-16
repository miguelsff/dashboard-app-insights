"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS, CHART_MARGIN, LEGEND_STYLE } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";
import ChartCard from "@/components/ui/ChartCard";

export default function LatencyTimeSeriesChart() {
  const { latencyTimeSeriesData, isLoading } = useTelemetry();

  return (
    <ChartCard
      title="Latencia E2E en el Tiempo"
      fullTitle="Latencia E2E en el Tiempo (p50 / p95)"
      isLoading={isLoading}
      isEmpty={latencyTimeSeriesData.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={latencyTimeSeriesData} margin={CHART_MARGIN}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="day" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} tickFormatter={(v: number) => formatDuration(v)} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [formatDuration(Number(value)), String(name)]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
          <Line
            type="monotone"
            dataKey="p50Ms"
            name="p50"
            stroke={VISTA1_COLORS.p50}
            strokeWidth={2}
            dot={{ r: 4, fill: VISTA1_COLORS.p50 }}
          />
          <Line
            type="monotone"
            dataKey="p95Ms"
            name="p95"
            stroke={VISTA1_COLORS.p95}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 4, fill: VISTA1_COLORS.p95 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
