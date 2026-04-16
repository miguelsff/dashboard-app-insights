"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { formatDuration } from "@/lib/format";

function KpiCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3">
      <div className="skeleton w-9 h-9 rounded-lg" />
      <div className="space-y-2 pt-1">
        <div className="skeleton h-7 w-14 rounded-md" />
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-3 w-36 rounded" />
      </div>
    </div>
  );
}

export default function KpiCards() {
  const { traceKpis, isLoading } = useTelemetry();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Traces",
      value: traceKpis.totalTraces.toString(),
      sub: "agent conversations",
      color: "text-azure-400",
      bg: "bg-azure-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: "Trace Success Rate",
      value: `${traceKpis.traceSuccessRate}%`,
      sub: `${traceKpis.successfulTraces} of ${traceKpis.totalTraces} succeeded`,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Avg Trace Duration",
      value: formatDuration(traceKpis.avgTraceDurationMs),
      sub: `${traceKpis.avgSpansPerTrace} spans avg per trace`,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Avg LLM Latency",
      value: traceKpis.avgLlmLatencyMs > 0 ? formatDuration(traceKpis.avgLlmLatencyMs) : '—',
      sub: `${traceKpis.totalLlmCalls} LLM calls total`,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, color, bg, icon }) => (
        <div key={label} className="card flex flex-col gap-3">
          <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
