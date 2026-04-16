"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { AXIS_BASE, AXIS_TICK, GRID_PROPS, TOOLTIP_STYLE, CATEGORY_COLORS } from "@/lib/chart-theme";
import type { SpanCategory } from "@/types/telemetry";

const LABELS: Record<SpanCategory, string> = {
  llm:   'LLM',
  tool:  'Tool',
  http:  'HTTP',
  db:    'Database',
  other: 'Other',
};

export default function SpanCategoryChart() {
  const { spanCategoryData, isLoading } = useTelemetry();

  if (isLoading) {
    return (
      <div className="card">
        <p className="card-title mb-4">Span Types</p>
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  if (spanCategoryData.length === 0) {
    return (
      <div className="card">
        <p className="card-title mb-4">Span Types</p>
        <p className="text-sm text-gray-500 text-center py-12">No data.</p>
      </div>
    );
  }

  const data = spanCategoryData.map((d) => ({
    name: LABELS[d.category] ?? d.category,
    count: d.count,
    color: CATEGORY_COLORS[d.category] ?? '#6b7280',
  }));

  return (
    <div className="card">
      <p className="card-title mb-4">Span Types</p>
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
    </div>
  );
}
