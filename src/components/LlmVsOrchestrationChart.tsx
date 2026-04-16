"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { TOOLTIP_STYLE, VISTA1_COLORS, LEGEND_STYLE } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";
import ChartCard from "@/components/ui/ChartCard";

const COLORS = [VISTA1_COLORS.llmTime, VISTA1_COLORS.orchestrationTime];

export default function LlmVsOrchestrationChart() {
  const { llmVsOrchestrationData, isLoading } = useTelemetry();

  const total = llmVsOrchestrationData.reduce((s, d) => s + d.durationMs, 0);

  return (
    <ChartCard
      title="LLM vs Orquestación"
      fullTitle="Tiempo en LLM vs Orquestación (promedio por traza)"
      isLoading={isLoading}
      isEmpty={total === 0}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={llmVsOrchestrationData}
            dataKey="durationMs"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            label={(props: PieLabelRenderProps) => {
              const d = props as PieLabelRenderProps & { name: string; durationMs: number };
              return `${d.name}: ${formatDuration(d.durationMs)} (${Math.round((d.durationMs / total) * 100)}%)`;
            }}
          >
            {llmVsOrchestrationData.map((d, i) => (
              <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [formatDuration(Number(value)), String(name)]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
