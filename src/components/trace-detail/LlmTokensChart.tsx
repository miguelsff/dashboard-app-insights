"use client";

import type { LlmCallTokenDatum } from "@/types/telemetry";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";

export default function LlmTokensChart({ data }: { data: LlmCallTokenDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Tokens por LLM Call</h3>
        <p className="text-sm text-gray-500">No LLM calls in this trace</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    name: `${d.index}. ${d.label} (${d.parentAgent})`,
  }));

  return (
    <div className="card">
      <h3 className="card-title">Tokens por LLM Call</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
          <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
          <Bar dataKey="inputTokens" name="Input" stackId="tokens" fill={VISTA1_COLORS.inputTokens} />
          <Bar dataKey="outputTokens" name="Output" stackId="tokens" fill={VISTA1_COLORS.outputTokens} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
