"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS, CHART_MARGIN_WIDE } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";
import ChartCard from "@/components/ui/ChartCard";

export default function StageDurationChart() {
  const { stageDurationData, isLoading } = useTelemetry();

  return (
    <ChartCard
      title="Duración Promedio por Etapa"
      fullTitle="Duración Promedio por Etapa del Pipeline"
      isLoading={isLoading}
      isEmpty={stageDurationData.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={stageDurationData} layout="vertical" margin={{ ...CHART_MARGIN_WIDE, left: 120 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis type="number" tick={AXIS_TICK} {...AXIS_BASE} tickFormatter={(v: number) => formatDuration(v)} />
          <YAxis type="category" dataKey="stage" tick={AXIS_TICK} {...AXIS_BASE} width={110} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [formatDuration(Number(value)), "Avg Duration"]}
          />
          <Bar dataKey="avgDurationMs" fill={VISTA1_COLORS.p50} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
