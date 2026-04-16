"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, CATEGORY_COLORS, CHART_MARGIN_WIDE } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";
import ChartCard from "@/components/ui/ChartCard";

export default function AgentInvocationsChart() {
  const { agentInvocationsData, isLoading } = useTelemetry();

  return (
    <ChartCard
      title="Invocaciones por Agente"
      isLoading={isLoading}
      isEmpty={agentInvocationsData.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={agentInvocationsData} layout="vertical" margin={CHART_MARGIN_WIDE}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis type="number" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis type="category" dataKey="agent" tick={AXIS_TICK} {...AXIS_BASE} width={90} />
          <Tooltip
            {...TOOLTIP_STYLE}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { agent: string; count: number; avgDurationMs: number };
              return (
                <div style={TOOLTIP_STYLE.contentStyle}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.agent}</p>
                  <p>Invocaciones: {d.count}</p>
                  <p>Avg duration: {formatDuration(d.avgDurationMs)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" fill={CATEGORY_COLORS.agent} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
