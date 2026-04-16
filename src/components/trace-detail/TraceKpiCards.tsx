"use client";

import { useState } from "react";
import type { TraceDetailKpis } from "@/types/telemetry";
import { formatDuration, formatCurrency, formatTokenCount } from "@/lib/format";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} className="ml-1.5 text-gray-500 hover:text-gray-300" title="Copy full ID">
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function TraceKpiCards({ kpis }: { kpis: TraceDetailKpis }) {
  const cards = [
    {
      label: "Trace ID",
      value: (
        <span className="flex items-center">
          <span className="font-mono text-sm">{kpis.traceId.slice(0, 16)}</span>
          <CopyButton text={kpis.traceId} />
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
