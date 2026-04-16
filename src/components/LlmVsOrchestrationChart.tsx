"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { TOOLTIP_STYLE, VISTA1_COLORS } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";

const COLORS = [VISTA1_COLORS.llmTime, VISTA1_COLORS.orchestrationTime];

export default function LlmVsOrchestrationChart() {
  const { llmVsOrchestrationData, isLoading } = useTelemetry();

  if (isLoading) {
    return <div className="card"><div className="skeleton h-64 rounded-lg" /></div>;
  }

  const total = llmVsOrchestrationData.reduce((s, d) => s + d.durationMs, 0);
  if (total === 0) {
    return (
      <div className="card">
        <h3 className="card-title">LLM vs Orquestación</h3>
        <p className="text-sm text-gray-500">No data in this period</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title">Tiempo en LLM vs Orquestación (promedio por traza)</h3>
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
          <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
