"use client";

import type { LlmCallTokenDatum } from "@/types/telemetry";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS, CHART_MARGIN, LEGEND_STYLE } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";
import ChartCard from "@/components/ui/ChartCard";

export default function LlmTokensChart({ data, isLoading = false }: { data: LlmCallTokenDatum[]; isLoading?: boolean }) {
  const chartData = data.map(d => ({
    ...d,
    name: `${d.index}. ${d.label} (${d.parentAgent})`,
  }));

  return (
    <ChartCard
      title="Tokens por LLM Call"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyMessage="No LLM calls in this trace"
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="name" tick={AXIS_TICK} {...AXIS_BASE} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} />
          <Tooltip
            {...TOOLTIP_STYLE}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as LlmCallTokenDatum & { name: string };
              return (
                <div style={TOOLTIP_STYLE.contentStyle}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
                  <p>Model: {d.model}</p>
                  <p>Input: {d.inputTokens.toLocaleString()}</p>
                  <p>Output: {d.outputTokens.toLocaleString()}</p>
                  <p>Finish: {d.finishReason}</p>
                  <p>LLM Latency: {formatDuration(d.llmLatencyMs)}</p>
                  {d.temperature && <p>Temperature: {d.temperature}</p>}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
          <Bar dataKey="inputTokens" name="Input" stackId="tokens" fill={VISTA1_COLORS.inputTokens} />
          <Bar dataKey="outputTokens" name="Output" stackId="tokens" fill={VISTA1_COLORS.outputTokens} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
