"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { TOOLTIP_STYLE, FINISH_REASON_COLORS } from "@/lib/chart-theme";

const FALLBACK_COLOR = "#6b7280";

export default function FinishReasonsChart() {
  const { finishReasonsData, isLoading } = useTelemetry();

  if (isLoading) {
    return <div className="card"><div className="skeleton h-64 rounded-lg" /></div>;
  }

  if (finishReasonsData.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Finish Reasons</h3>
        <p className="text-sm text-gray-500">No data in this period</p>
      </div>
    );
  }

  const total = finishReasonsData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="card">
      <h3 className="card-title">Finish Reasons</h3>
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
          <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
