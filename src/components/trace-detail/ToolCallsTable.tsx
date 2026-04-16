"use client";

import type { ToolCallRow } from "@/types/telemetry";
import ExpandableText from "@/components/ui/ExpandableText";
import DurationBadge from "@/components/ui/DurationBadge";

export default function ToolCallsTable({ rows }: { rows: ToolCallRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Tool Calls</h3>
        <p className="text-sm text-gray-500">No tool calls in this trace</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title">Detalle de Tool Calls</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-surface-700">
              <th className="pb-2 pr-3 font-medium">Tool</th>
              <th className="pb-2 pr-3 font-medium">Type</th>
              <th className="pb-2 pr-3 font-medium">Call ID</th>
              <th className="pb-2 pr-3 font-medium">Argumentos</th>
              <th className="pb-2 pr-3 font-medium">Resultado</th>
              <th className="pb-2 pr-3 font-medium">Duración</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 font-medium">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
                <tr key={i} className="border-b border-surface-700/50">
                  <td className="py-2.5 pr-3 font-medium text-gray-300">{r.toolName}</td>
                  <td className="py-2.5 pr-3 text-gray-500">{r.toolType ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-mono text-gray-500">{r.callId ? r.callId.slice(0, 12) : "—"}</td>
                  <td className="py-2.5 pr-3 max-w-xs"><ExpandableText text={r.arguments} /></td>
                  <td className="py-2.5 pr-3 max-w-xs"><ExpandableText text={r.result} /></td>
                  <td className="py-2.5 pr-3"><DurationBadge ms={r.durationMs} /></td>
                  <td className="py-2.5 pr-3">
                    <span className={r.status.includes('ERROR') ? 'badge-failure' : 'badge-neutral'}>
                      {r.status.replace('STATUS_CODE_', '')}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-500 max-w-[200px] truncate">{r.description ?? "—"}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
