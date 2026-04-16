"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { formatDuration, formatUtcTime } from "@/lib/format";

// This component is intentionally server-compatible (no "use client" needed since
// it reads from context which is client-side already). The parent wraps it.
export default function SlowestTracesCard() {
  const { slowestTraces, isLoading } = useTelemetry();

  if (isLoading) {
    return (
      <div className="card">
        <p className="card-title mb-4">Slowest Traces</p>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-8 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (slowestTraces.length === 0) {
    return (
      <div className="card">
        <p className="card-title mb-4">Slowest Traces</p>
        <p className="text-sm text-gray-500 text-center py-6">No traces in this period.</p>
      </div>
    );
  }

  const maxDuration = slowestTraces[0].durationMs;

  return (
    <div className="card">
      <p className="card-title mb-4">Slowest Traces (top 10)</p>
      <div className="space-y-2">
        {slowestTraces.map((t, i) => {
          const pct = maxDuration > 0 ? (t.durationMs / maxDuration) * 100 : 0;
          return (
            <div key={t.traceId} className="flex items-center gap-3 group">
              <span className="text-xs text-gray-600 w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-gray-300 truncate" title={t.operationName}>
                    {t.operationName}
                  </span>
                  <span className="text-xs font-mono text-yellow-400 shrink-0">
                    {formatDuration(t.durationMs)}
                  </span>
                </div>
                <div className="h-1 rounded bg-surface-700 overflow-hidden">
                  <div
                    className="h-full rounded bg-yellow-500/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-gray-600">{formatUtcTime(t.startTime)}</span>
                  <span className="text-[10px] text-gray-600">{t.spanCount} spans</span>
                  {!t.success && <span className="text-[10px] text-red-400">failed</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
