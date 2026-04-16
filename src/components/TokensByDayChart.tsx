"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS, CHART_MARGIN, LEGEND_STYLE } from "@/lib/chart-theme";
import ChartCard from "@/components/ui/ChartCard";

export default function TokensByDayChart() {
  const { tokensByDayData, isLoading } = useTelemetry();

  return (
    <ChartCard
      title="Tokens por Día"
      fullTitle="Tokens por Día (Input vs Output)"
      isLoading={isLoading}
      isEmpty={tokensByDayData.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={tokensByDayData} margin={CHART_MARGIN}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="day" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} tickFormatter={(v: number) => v.toLocaleString()} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [Number(value).toLocaleString(), String(name)]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
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
    </ChartCard>
  );
}
