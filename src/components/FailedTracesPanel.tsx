"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { formatDuration, formatUtcTime } from "@/lib/format";

export default function FailedTracesPanel() {
  const { failedTraces, isLoading } = useTelemetry();

  if (isLoading || failedTraces.length === 0) return null;

  return (
    <div className="card border border-red-500/20">
      <p className="card-title mb-4 text-red-400">
        Failed Traces ({failedTraces.length})
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {failedTraces.map((t) => {
          const firstFailingSpan = t.spans.find(
            (s) => s.itemType === 'exception' || s.customDimensions['otel.status_code'] === 'STATUS_CODE_ERROR'
          );
          return (
            <div key={t.traceId} className="bg-surface-900 rounded-lg p-3 border border-red-500/10 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-red-300 truncate" title={t.operationName}>
                  {t.operationName}
                </span>
                <span className="badge-failure shrink-0">failed</span>
              </div>

              {t.failureReason && (
                <p className="text-xs text-red-300/80 bg-red-500/5 rounded px-2 py-1 truncate" title={t.failureReason}>
                  {t.failureReason.slice(0, 180)}
                </p>
              )}

              {firstFailingSpan && (
                <p className="text-xs text-gray-500">
                  Failing span: <span className="text-gray-400">{firstFailingSpan.target || firstFailingSpan.itemType}</span>
                </p>
              )}

              <div className="flex gap-3 text-[10px] text-gray-600">
                <span>{formatUtcTime(t.startTime)}</span>
                <span>{formatDuration(t.durationMs)}</span>
                <span>{t.spanCount} spans</span>
                {t.conversationId && (
                  <span className="truncate" title={t.conversationId}>
                    conv: {t.conversationId.slice(0, 8)}…
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
