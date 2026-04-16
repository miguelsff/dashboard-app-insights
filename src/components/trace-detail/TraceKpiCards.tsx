"use client";

import type { TraceDetailKpis } from "@/types/telemetry";
import { formatDuration, formatCurrency, formatTokenCount } from "@/lib/format";
import CopyButton from "@/components/ui/CopyButton";

export default function TraceKpiCards({ kpis }: { kpis: TraceDetailKpis }) {
  const cards = [
    {
      label: "Trace ID",
      value: (
        <span className="flex items-center">
          <span className="font-mono text-sm">{kpis.traceId.slice(0, 16)}</span>
          <CopyButton text={kpis.traceId} className="ml-1.5" />
        </span>
      ),
      sub: "operation_Id",
      color: "text-azure-400",
      bg: "bg-azure-500/10",
    },
    {
      label: "Inicio",
      value: kpis.startTime.slice(11, 23),
      sub: kpis.startTime.slice(0, 10),
      color: "text-gray-300",
      bg: "bg-gray-500/10",
    },
    {
      label: "Duración Total",
      value: formatDuration(kpis.durationMs),
      sub: `${Math.round(kpis.durationMs).toLocaleString()} ms`,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Total Spans",
      value: kpis.spanCount.toString(),
      sub: "spans in trace",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Tokens (In / Out)",
      value: `${formatTokenCount(kpis.totalInputTokens)} / ${formatTokenCount(kpis.totalOutputTokens)}`,
      sub: `${(kpis.totalInputTokens + kpis.totalOutputTokens).toLocaleString()} total`,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Costo Estimado",
      value: formatCurrency(kpis.estimatedCostUsd),
      sub: "based on model pricing",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, sub, color, bg }) => (
        <div key={label} className="card flex flex-col gap-2">
          <div className={`w-2 h-2 rounded-full ${bg.replace('/10', '')} ${color}`} />
          <div>
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
