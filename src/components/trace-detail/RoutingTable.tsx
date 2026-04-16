"use client";

import type { RoutingRow } from "@/types/telemetry";
import { formatDuration } from "@/lib/format";
import CollapsibleSection from "./CollapsibleSection";
import JsonViewer from "./JsonViewer";

export default function RoutingTable({ rows }: { rows: RoutingRow[] }) {
  if (rows.length === 0) return null;

  return (
    <CollapsibleSection title="Routing y Orquestación">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-surface-700">
              <th className="pb-2 pr-3 font-medium">Span</th>
              <th className="pb-2 pr-3 font-medium">Executor Type</th>
              <th className="pb-2 pr-3 font-medium">Executor ID</th>
              <th className="pb-2 pr-3 font-medium">Edge Group</th>
              <th className="pb-2 pr-3 font-medium">Delivered</th>
              <th className="pb-2 pr-3 font-medium">Duración</th>
              <th className="pb-2 pr-3 font-medium">Linked Spans</th>
              <th className="pb-2 font-medium">Output</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-surface-700/50">
                <td className="py-2.5 pr-3 text-gray-300 font-medium">{r.target}</td>
                <td className="py-2.5 pr-3 text-gray-400">{r.executorType ?? "—"}</td>
                <td className="py-2.5 pr-3 text-gray-500 font-mono">{r.executorId ?? "—"}</td>
                <td className="py-2.5 pr-3 text-gray-400">{r.edgeGroupType ?? "—"}</td>
                <td className="py-2.5 pr-3">
                  {r.delivered !== null ? (
                    <span className={r.delivered === 'true' ? 'badge-success' : 'badge-neutral'}>
                      {r.delivered}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-2.5 pr-3 font-mono text-gray-400">{formatDuration(r.durationMs)}</td>
                <td className="py-2.5 pr-3 max-w-[200px]">
                  {r.linkedSpans ? <JsonViewer value={r.linkedSpans} /> : "—"}
                </td>
                <td className="py-2.5 max-w-[200px]">
                  {r.output ? <JsonViewer value={r.output} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
