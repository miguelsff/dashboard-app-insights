"use client";

import { useState } from "react";
import type { SpanTreeNode } from "@/types/telemetry";
import { classifyWaterfallSpan, flattenTree } from "@/data/trace-detail";
import { WATERFALL_COLORS } from "@/lib/chart-theme";
import { formatDuration } from "@/lib/format";
import SpanDetailPanel from "./SpanDetailPanel";

function TimeTicks({ durationMs }: { durationMs: number }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="flex-1 relative h-5 border-b border-surface-700">
      {ticks.map(pct => (
        <span
          key={pct}
          className="absolute text-[10px] text-gray-600 -translate-x-1/2"
          style={{ left: `${pct * 100}%` }}
        >
          {formatDuration(Math.round(durationMs * pct))}
        </span>
      ))}
    </div>
  );
}

function WaterfallRow({
  node,
  traceDurationMs,
  isSelected,
  onClick,
}: {
  node: SpanTreeNode;
  traceDurationMs: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const spanType = classifyWaterfallSpan(node.span);
  const color = WATERFALL_COLORS[spanType] ?? WATERFALL_COLORS.other;
  const leftPct = traceDurationMs > 0 ? (node.offsetMs / traceDurationMs) * 100 : 0;
  const widthPct = traceDurationMs > 0 ? Math.max((node.span.duration / traceDurationMs) * 100, 0.3) : 0.3;

  return (
    <div
      onClick={onClick}
      className={`flex items-center h-7 cursor-pointer border-b border-surface-700/30 transition-colors ${
        isSelected ? "bg-azure-500/10 ring-1 ring-inset ring-azure-500/30" : "hover:bg-surface-700/30"
      }`}
    >
      <div
        className="w-[280px] shrink-0 flex items-center overflow-hidden pr-2"
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
      >
        {node.depth > 0 && (
          <span className="text-gray-700 mr-1.5 text-[10px]">└</span>
        )}
        <span
          className="w-2 h-2 rounded-sm shrink-0 mr-1.5"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-gray-300 truncate">{node.span.target}</span>
      </div>
      <div className="flex-1 relative h-5">
        <div
          className="absolute top-0.5 h-4 rounded-sm min-w-[2px]"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            backgroundColor: color,
          }}
        />
        <span
          className="absolute text-[10px] text-gray-500 top-0.5 whitespace-nowrap"
          style={{ left: `${Math.min(leftPct + widthPct + 0.5, 95)}%` }}
        >
          {formatDuration(node.span.duration)}
        </span>
      </div>
    </div>
  );
}

export default function SpanWaterfall({
  tree,
  traceDurationMs,
}: {
  tree: SpanTreeNode[];
  traceDurationMs: number;
}) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const flatNodes = flattenTree(tree);
  const selectedNode = selectedSpanId
    ? flatNodes.find(n => n.span.id === selectedSpanId) ?? null
    : null;

  const legendEntries = Object.entries(WATERFALL_COLORS).filter(([type]) => {
    return flatNodes.some(n => classifyWaterfallSpan(n.span) === type);
  });

  return (
    <div className="card">
      <h3 className="card-title">Span Waterfall</h3>

      <div className="flex flex-wrap gap-3 mb-4">
        {legendEntries.map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-400">{type}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="flex">
            <div className="w-[280px] shrink-0" />
            <TimeTicks durationMs={traceDurationMs} />
          </div>

          {flatNodes.map(node => (
            <WaterfallRow
              key={node.span.id}
              node={node}
              traceDurationMs={traceDurationMs}
              isSelected={selectedSpanId === node.span.id}
              onClick={() => setSelectedSpanId(
                selectedSpanId === node.span.id ? null : node.span.id,
              )}
            />
          ))}
        </div>
      </div>

      {selectedNode && (
        <SpanDetailPanel
          span={selectedNode.span}
          onClose={() => setSelectedSpanId(null)}
        />
      )}
    </div>
  );
}
