"use client";

import { useState } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatDuration, formatUtcTimeMs, formatTokenCount } from "@/lib/format";
import type { EnhancedTrace } from "@/types/telemetry";

const PAGE_SIZE = 20;

type SortKey = "newest" | "oldest" | "slowest" | "mostSpans";

function sortTraces(traces: EnhancedTrace[], key: SortKey): EnhancedTrace[] {
  const sorted = [...traces];
  switch (key) {
    case "newest":  return sorted.sort((a, b) => b.startTime.localeCompare(a.startTime));
    case "oldest":  return sorted.sort((a, b) => a.startTime.localeCompare(b.startTime));
    case "slowest": return sorted.sort((a, b) => b.durationMs - a.durationMs);
    case "mostSpans": return sorted.sort((a, b) => b.spanCount - a.spanCount);
  }
}

function DurationBadge({ ms }: { ms: number }) {
  const color = ms > 15000 ? "text-red-400" : ms > 5000 ? "text-yellow-400" : "text-emerald-400";
  return <span className={`font-mono text-xs ${color}`}>{formatDuration(ms)}</span>;
}

function StatusBadge({ status }: { status: "ok" | "error" | "unset" }) {
  if (status === "ok") return <span className="badge-success">OK</span>;
  if (status === "error") return <span className="badge-failure">ERROR</span>;
  return <span className="badge-neutral">UNSET</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} className="ml-1 text-gray-500 hover:text-gray-300" title="Copy full ID">
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

export default function TraceTable() {
  const { enhancedTraces, isLoading } = useTelemetry();
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="card-title">Trazas Recientes</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
        </div>
      </div>
    );
  }

  const sorted = sortTraces(enhancedTraces, sort);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="card-title mb-0">Trazas Recientes</h3>
        <div className="flex gap-1">
          {(["newest", "oldest", "slowest", "mostSpans"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => { setSort(key); setPage(0); }}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                sort === key
                  ? "bg-azure-500/20 text-azure-400"
                  : "text-gray-500 hover:text-gray-300 hover:bg-surface-700"
              }`}
            >
              {key === "newest" ? "Newest" : key === "oldest" ? "Oldest" : key === "slowest" ? "Slowest" : "Most Spans"}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">No traces in this period</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-surface-700">
                  <th className="pb-2 pr-3 font-medium">Timestamp</th>
                  <th className="pb-2 pr-3 font-medium">Trace ID</th>
                  <th className="pb-2 pr-3 font-medium">Session ID</th>
                  <th className="pb-2 pr-3 font-medium">Version</th>
                  <th className="pb-2 pr-3 font-medium">Duración</th>
                  <th className="pb-2 pr-3 font-medium text-center"># Spans</th>
                  <th className="pb-2 pr-3 font-medium">Tokens</th>
                  <th className="pb-2 pr-3 font-medium">Modelos</th>
                  <th className="pb-2 pr-3 font-medium">Agentes</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.traceId} className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors">
                    <td className="py-2.5 pr-3 font-mono text-gray-300 whitespace-nowrap">
                      {formatUtcTimeMs(t.startTime)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center">
                        <Link href={`/trace/${t.traceId}`} className="font-mono text-azure-400 hover:text-azure-300 hover:underline">
                          {t.traceId.slice(0, 16)}
                        </Link>
                        <CopyButton text={t.traceId} />
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-gray-500">
                      {t.sessionId ? t.sessionId.slice(0, 8) : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-400">
                      {t.agentVersion ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <DurationBadge ms={t.durationMs} />
                    </td>
                    <td className="py-2.5 pr-3 text-center text-gray-400">{t.spanCount}</td>
                    <td className="py-2.5 pr-3 font-mono text-gray-400 whitespace-nowrap">
                      {formatTokenCount(t.totalInputTokens)} / {formatTokenCount(t.totalOutputTokens)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="flex flex-wrap gap-1">
                        {t.models.map(m => <span key={m} className="badge-model">{m}</span>)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="flex flex-wrap gap-1">
                        {t.agents.map(a => <span key={a} className="badge-agent">{a}</span>)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2.5">
                      {t.traceLink ? (
                        <span className="flex items-center">
                          <span className="font-mono text-xs text-gray-400">{t.traceLink.slice(0, 8)}</span>
                          <CopyButton text={t.traceLink} />
                        </span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-700">
              <span className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2.5 py-1 rounded text-xs text-gray-400 hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-2.5 py-1 rounded text-xs text-gray-400 hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
