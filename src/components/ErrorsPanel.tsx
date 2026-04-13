"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { formatDuration, formatUtcTime } from "@/lib/format";

export default function ErrorsPanel() {
  const { failedRecords, isLoading } = useTelemetry();

  if (isLoading || failedRecords.length === 0) return null;

  return (
    <div className="card border-red-900/50">
      <p className="card-title text-red-400">Failures ({failedRecords.length})</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {failedRecords.map((r) => {
          const errMsg = r.customDimensions["error.message"] ?? "Unknown error";
          const traceId = r.customDimensions["otel.trace_id"] ?? r.operation_Id;
          return (
            <div
              key={r.id}
              className="bg-surface-900 border border-red-900/40 border-l-4 border-l-red-500 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">{formatUtcTime(r.timestamp)}</span>
                <span className="badge-failure">HTTP {r.resultCode || "500"}</span>
              </div>
              <p className="text-sm font-medium text-gray-200">{r.operation_Name}</p>
              <p className="text-xs text-red-300 bg-red-950/40 rounded p-2 break-words leading-relaxed">
                {errMsg.length > 220 ? errMsg.slice(0, 220) + "…" : errMsg}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                <div>
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="text-gray-300 font-mono">{formatDuration(r.duration)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Perf. Bucket</dt>
                  <dd className="text-gray-300 font-mono">{r.performanceBucket}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500">Trace ID</dt>
                  <dd className="text-gray-300 font-mono truncate">{traceId}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
