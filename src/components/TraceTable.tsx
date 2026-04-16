"use client";

import { useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatDuration, formatUtcTime } from "@/lib/format";
import { categorizeSpan } from "@/data/telemetry";
import { CATEGORY_COLORS } from "@/lib/chart-theme";
import type { Trace, TelemetryRecord } from "@/types/telemetry";

type SortKey = 'newest' | 'oldest' | 'slowest' | 'mostSpans';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',    label: 'Newest' },
  { key: 'oldest',   label: 'Oldest' },
  { key: 'slowest',  label: 'Slowest' },
  { key: 'mostSpans', label: 'Most Spans' },
];

function sortTraces(traces: Trace[], key: SortKey): Trace[] {
  const copy = [...traces];
  switch (key) {
    case 'newest':    return copy.sort((a, b) => b.startTime.localeCompare(a.startTime));
    case 'oldest':    return copy.sort((a, b) => a.startTime.localeCompare(b.startTime));
    case 'slowest':   return copy.sort((a, b) => b.durationMs - a.durationMs);
    case 'mostSpans': return copy.sort((a, b) => b.spanCount - a.spanCount);
  }
}

function SpanRow({ span, depth = 0 }: { span: TelemetryRecord; depth?: number }) {
  const cat   = categorizeSpan(span);
  const color = CATEGORY_COLORS[cat];
  const label = cat.toUpperCase();

  return (
    <tr className="border-t border-surface-700/40 hover:bg-surface-800/50">
      <td className="py-1.5 px-3" style={{ paddingLeft: `${12 + depth * 16}px` }}>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-gray-300 truncate max-w-[200px]" title={span.name}>
            {span.name || '—'}
          </span>
          <span className="text-[10px] px-1 rounded" style={{ color, background: `${color}22` }}>
            {label}
          </span>
        </div>
      </td>
      <td className="py-1.5 px-3 text-xs text-gray-500">{formatUtcTime(span.timestamp)}</td>
      <td className="py-1.5 px-3 text-xs text-gray-400">{formatDuration(span.duration)}</td>
      <td className="py-1.5 px-3">
        <span className={span.success ? 'badge-success' : 'badge-failure'}>
          {span.success ? 'ok' : 'fail'}
        </span>
      </td>
      <td className="py-1.5 px-3 text-xs text-gray-600 truncate max-w-[160px]" title={span.target}>
        {span.target || '—'}
      </td>
    </tr>
  );
}

function TraceRow({ trace, index }: { trace: Trace; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-t border-surface-700 hover:bg-surface-800 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-2 px-3 text-xs text-gray-600">{index + 1}</td>
        <td className="py-2 px-3 text-xs text-gray-400 font-mono">{formatUtcTime(trace.startTime)}</td>
        <td className="py-2 px-3 text-xs text-gray-500 font-mono" title={trace.traceId}>
          {trace.traceId.slice(0, 8)}…
        </td>
        <td className="py-2 px-3 text-xs text-gray-200 truncate max-w-[180px]" title={trace.operationName}>
          {trace.operationName}
        </td>
        <td className="py-2 px-3">
          <span className={trace.success ? 'badge-success' : 'badge-failure'}>
            {trace.success ? 'ok' : 'fail'}
          </span>
        </td>
        <td className="py-2 px-3 text-xs text-yellow-300">{formatDuration(trace.durationMs)}</td>
        <td className="py-2 px-3 text-xs text-gray-400 text-center">{trace.spanCount}</td>
        <td className="py-2 px-3 text-xs text-violet-300 text-center">{trace.llmCallCount || '—'}</td>
        <td className="py-2 px-3 text-xs text-cyan-300 text-center">{trace.toolCallCount || '—'}</td>
        <td className="py-2 px-3 text-gray-500">
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={10} className="p-0">
            <div className="bg-surface-900 border-b border-surface-700">
              {trace.failureReason && (
                <div className="px-4 py-2 text-xs text-red-300 bg-red-500/5 border-b border-red-500/10">
                  Error: {trace.failureReason}
                </div>
              )}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-700/40">
                    <th className="py-1 px-3 text-[10px] text-gray-600 text-left font-medium">Span</th>
                    <th className="py-1 px-3 text-[10px] text-gray-600 text-left font-medium">Time</th>
                    <th className="py-1 px-3 text-[10px] text-gray-600 text-left font-medium">Duration</th>
                    <th className="py-1 px-3 text-[10px] text-gray-600 text-left font-medium">Status</th>
                    <th className="py-1 px-3 text-[10px] text-gray-600 text-left font-medium">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {trace.spans.map((span) => (
                    <SpanRow key={span.id} span={span} />
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function TraceTable() {
  const { traces, isLoading } = useTelemetry();
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  if (isLoading) {
    return (
      <div className="card">
        <p className="card-title mb-4">Traces</p>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-9 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const sorted = sortTraces(traces, sortKey);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="card-title">Traces ({traces.length})</p>
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                sortKey === opt.key
                  ? 'bg-azure-600 text-white'
                  : 'border border-surface-700 text-gray-400 hover:bg-surface-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {traces.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No traces found for this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 bg-surface-800 z-10">
              <tr className="border-b border-surface-700">
                <th className="py-2 px-3 text-[10px] text-gray-500 text-left font-medium w-8">#</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-left font-medium">Start (UTC)</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-left font-medium">Trace ID</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-left font-medium">Operation</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-left font-medium">Status</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-left font-medium">Duration</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-center font-medium">Spans</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-center font-medium">LLM</th>
                <th className="py-2 px-3 text-[10px] text-gray-500 text-center font-medium">Tools</th>
                <th className="py-2 px-3 w-6" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((trace, i) => (
                <TraceRow key={trace.traceId} trace={trace} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
