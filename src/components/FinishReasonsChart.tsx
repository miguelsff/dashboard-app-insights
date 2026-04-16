"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { TOOLTIP_STYLE, FINISH_REASON_COLORS, LEGEND_STYLE } from "@/lib/chart-theme";
import ChartCard from "@/components/ui/ChartCard";

const FALLBACK_COLOR = "#6b7280";

export default function FinishReasonsChart() {
  const { finishReasonsData, isLoading } = useTelemetry();

  const total = finishReasonsData.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard
      title="Finish Reasons"
      isLoading={isLoading}
      isEmpty={finishReasonsData.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={finishReasonsData}
            dataKey="count"
            nameKey="reason"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            label={(props: PieLabelRenderProps) => {
              const d = props as PieLabelRenderProps & { reason: string; count: number };
              return `${d.reason} (${Math.round((d.count / total) * 100)}%)`;
            }}
          >
            {finishReasonsData.map((d) => (
              <Cell key={d.reason} fill={FINISH_REASON_COLORS[d.reason] ?? FALLBACK_COLOR} />
            ))}
          </Pie>
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [Number(value), "Count"]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
