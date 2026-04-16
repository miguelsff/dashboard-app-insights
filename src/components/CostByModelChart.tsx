"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS, CHART_MARGIN, LEGEND_STYLE } from "@/lib/chart-theme";
import { formatCurrency } from "@/lib/format";
import ChartCard from "@/components/ui/ChartCard";

export default function CostByModelChart() {
  const { costByModelData, isLoading } = useTelemetry();

  return (
    <ChartCard
      title="Costo Estimado por Modelo"
      isLoading={isLoading}
      isEmpty={costByModelData.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={costByModelData} margin={CHART_MARGIN}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="model" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} tickFormatter={(v: number) => formatCurrency(v)} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
          <Bar dataKey="costInput" name="Costo Input" stackId="cost" fill={VISTA1_COLORS.inputTokens} radius={[0, 0, 0, 0]} />
          <Bar dataKey="costOutput" name="Costo Output" stackId="cost" fill={VISTA1_COLORS.outputTokens} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
