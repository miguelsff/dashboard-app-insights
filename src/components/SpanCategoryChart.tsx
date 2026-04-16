"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { AXIS_BASE, AXIS_TICK, GRID_PROPS, TOOLTIP_STYLE, CATEGORY_COLORS } from "@/lib/chart-theme";
import type { SpanCategory } from "@/types/telemetry";
import ChartCard from "@/components/ui/ChartCard";

const LABELS: Record<SpanCategory, string> = {
  llm:   'LLM',
  tool:  'Tool',
  agent: 'Agent',
  http:  'HTTP',
  other: 'Other',
};

export default function SpanCategoryChart() {
  const { spanCategoryData, isLoading } = useTelemetry();

  const data = spanCategoryData.map((d) => ({
    name: LABELS[d.category] ?? d.category,
    count: d.count,
    color: CATEGORY_COLORS[d.category] ?? '#6b7280',
  }));

  return (
    <ChartCard
      title="Span Types"
      isLoading={isLoading}
      isEmpty={spanCategoryData.length === 0}
      emptyMessage="No data."
      skeletonHeight="h-48"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis type="category" dataKey="name" tick={AXIS_TICK} {...AXIS_BASE} width={60} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Spans']} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
