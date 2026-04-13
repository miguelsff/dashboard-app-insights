"use client";

import { Fragment, useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatDuration, formatUtcTimeMs } from "@/lib/format";

function shortName(name: string): string {
  return name
    .replace("genai.http POST /api/", "POST /api/")
    .replace("credicorp-dispatcher.", "");
}

export default function RequestsTable() {
  const { telemetryData } = useTelemetry();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ISO 8601 strings are lexicographically ordered — no Date allocation needed.
  const sorted = [...telemetryData].sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <div className="card">
      <p className="card-title">All Requests ({sorted.length})</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-surface-800">
            <tr className="text-left text-gray-500 border-b border-surface-700">
              <th className="py-2 pr-3 font-medium w-6">#</th>
              <th className="py-2 pr-3 font-medium">Timestamp (UTC)</th>
              <th className="py-2 pr-3 font-medium">Operation</th>
              <th className="py-2 pr-3 font-medium">Target</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium text-right">Duration</th>
              <th className="py-2 pr-3 font-medium">Perf. Bucket</th>
              <th className="py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const isOpen = expanded.has(r.id);
              const opName = r.customDimensions["gen_ai.operation.name"] ?? shortName(r.operation_Name);
              return (
                <Fragment key={r.id}>
                  <tr
                    className={`border-b border-surface-700/50 cursor-pointer transition-colors ${
                      isOpen ? "bg-surface-700/30" : "hover:bg-surface-700/20"
                    }`}
                    onClick={() => toggle(r.id)}
                  >
                    <td className="py-2 pr-3 text-gray-600">{i + 1}</td>
                    <td className="py-2 pr-3 font-mono text-gray-300" title={r.timestamp}>
                      {formatUtcTimeMs(r.timestamp)}
                    </td>
                    <td className="py-2 pr-3 text-gray-300 max-w-[180px] truncate" title={opName}>
                      {opName}
                    </td>
                    <td className="py-2 pr-3 text-gray-400 max-w-[160px] truncate" title={r.target}>
                      {shortName(r.target)}
                    </td>
                    <td className="py-2 pr-3">
                      {r.success ? (
                        <span className="badge-success">OK</span>
                      ) : (
                        <span className="badge-failure">FAIL</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-300">
                      {formatDuration(r.duration)}
                    </td>
                    <td className="py-2 pr-3 text-gray-400">{r.performanceBucket}</td>
                    <td className="py-2 text-gray-500 font-mono">{r.resultCode}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-surface-900/60">
                      <td colSpan={8} className="px-4 py-3">
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                          {Object.entries(r.customDimensions).map(([k, v]) => (
                            <div key={k} className="overflow-hidden">
                              <dt className="text-gray-500 text-xs">{k}</dt>
                              <dd
                                className="text-gray-300 font-mono text-xs mt-0.5 break-words"
                                title={v ?? ""}
                              >
                                {v && v.length > 120 ? v.slice(0, 120) + "…" : (v ?? "—")}
                              </dd>
                            </div>
                          ))}
                          <div>
                            <dt className="text-gray-500 text-xs">operation_Id</dt>
                            <dd className="text-gray-300 font-mono text-xs mt-0.5 truncate">
                              {r.operation_Id}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500 text-xs">span id</dt>
                            <dd className="text-gray-300 font-mono text-xs mt-0.5">{r.id}</dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
