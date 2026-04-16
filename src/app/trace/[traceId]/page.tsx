"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  buildSpanTree, computeTraceDetailKpis, extractTraceMetadata,
  extractLlmCallTokens, extractToolCalls, extractRoutingRows,
} from "@/data/trace-detail";
import TraceDetailHeader from "@/components/trace-detail/TraceDetailHeader";
import TraceKpiCards from "@/components/trace-detail/TraceKpiCards";
import TraceMetadataPanel from "@/components/trace-detail/TraceMetadataPanel";
import WorkflowGraph from "@/components/trace-detail/WorkflowGraph";
import SpanWaterfall from "@/components/trace-detail/SpanWaterfall";
import LlmTokensChart from "@/components/trace-detail/LlmTokensChart";
import ToolCallsTable from "@/components/trace-detail/ToolCallsTable";
import RoutingTable from "@/components/trace-detail/RoutingTable";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function TraceDetailPage() {
  const params = useParams<{ traceId: string }>();
  const { enhancedTraces, isLoading } = useTelemetry();

  const trace = useMemo(
    () => enhancedTraces.find(t => t.traceId === params.traceId) ?? null,
    [enhancedTraces, params.traceId],
  );

  const derived = useMemo(() => {
    if (!trace) return null;
    const tree = buildSpanTree(trace.spans);
    return {
      tree,
      kpis: computeTraceDetailKpis(trace),
      metadata: extractTraceMetadata(trace.spans),
      llmTokens: extractLlmCallTokens(trace.spans, tree),
      toolCalls: extractToolCalls(trace.spans),
      routingRows: extractRoutingRows(trace.spans),
    };
  }, [trace]);

  if (isLoading) {
    return (
      <main className="max-w-screen-2xl mx-auto px-4 py-8 space-y-5">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card"><div className="skeleton h-20 rounded" /></div>
          ))}
        </div>
        <div className="card"><div className="skeleton h-64 rounded" /></div>
      </main>
    );
  }

  if (!trace || !derived) {
    return (
      <main className="max-w-screen-2xl mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <h2 className="text-lg font-semibold text-white mb-2">Trace not found</h2>
          <p className="text-sm text-gray-400 mb-4">
            No trace with ID <code className="font-mono text-azure-400">{params.traceId}</code> in the current data range.
          </p>
          <Link href="/" className="text-sm text-azure-400 hover:text-azure-300 hover:underline">
            Back to Overview
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8 space-y-5">
      <TraceDetailHeader trace={trace} />
      <ErrorBoundary fallbackMessage="Error rendering trace detail">
        <TraceKpiCards kpis={derived.kpis} />
        <TraceMetadataPanel metadata={derived.metadata} />
        <WorkflowGraph spans={trace.spans} workflowDefinitionJson={derived.metadata.workflowDefinition} />
        <SpanWaterfall tree={derived.tree} traceDurationMs={trace.durationMs} />
        <LlmTokensChart data={derived.llmTokens} />
        <ToolCallsTable rows={derived.toolCalls} />
        <RoutingTable rows={derived.routingRows} />
      </ErrorBoundary>
    </main>
  );
}
