"use client";

import { useState } from "react";
import type { ToolCallRow } from "@/types/telemetry";
import { formatDuration } from "@/lib/format";
import JsonViewer from "./JsonViewer";

function ExpandableText({ text, maxLen = 60 }: { text: string | null; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-gray-600">—</span>;

  const isJson = text.startsWith('{') || text.startsWith('[');
  if (isJson) return <JsonViewer value={text} />;

  if (text.length <= maxLen) return <span className="text-gray-300 break-all">{text}</span>;

  return (
    <div>
      <span className="text-gray-300 break-all">
        {expanded ? text : `${text.slice(0, maxLen)}…`}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-azure-400 hover:text-azure-300 text-[10px]"
      >
        {expanded ? "less" : "more"}
      </button>
    </div>
  );
}

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
            {rows.map((r, i) => {
              const durColor = r.durationMs > 15000 ? "text-red-400" : r.durationMs > 5000 ? "text-yellow-400" : "text-emerald-400";
              return (
                <tr key={i} className="border-b border-surface-700/50">
                  <td className="py-2.5 pr-3 font-medium text-gray-300">{r.toolName}</td>
                  <td className="py-2.5 pr-3 text-gray-500">{r.toolType ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-mono text-gray-500">{r.callId ? r.callId.slice(0, 12) : "—"}</td>
                  <td className="py-2.5 pr-3 max-w-xs"><ExpandableText text={r.arguments} /></td>
                  <td className="py-2.5 pr-3 max-w-xs"><ExpandableText text={r.result} /></td>
                  <td className={`py-2.5 pr-3 font-mono ${durColor}`}>{formatDuration(r.durationMs)}</td>
                  <td className="py-2.5 pr-3">
                    <span className={r.status.includes('ERROR') ? 'badge-failure' : 'badge-neutral'}>
                      {r.status.replace('STATUS_CODE_', '')}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-500 max-w-[200px] truncate">{r.description ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
