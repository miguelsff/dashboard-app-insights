import type { SpanCategory, Trace, TraceKpis, TelemetryRecord } from '@/types/telemetry';

export function categorizeSpan(r: TelemetryRecord): SpanCategory {
  const op = (r.customDimensions['gen_ai.operation.name'] ?? '').toLowerCase();
  if (op === 'chat') return 'llm';
  if (op === 'execute_tool') return 'tool';
  if (op === 'invoke_agent') return 'agent';
  if (r.itemType === 'request') return 'http';
  // Fallback: inspect target prefix
  const t = (r.target ?? '').toLowerCase();
  if (t.startsWith('chat ')) return 'llm';
  if (t.startsWith('execute_tool ')) return 'tool';
  if (t.startsWith('invoke_agent ')) return 'agent';
  return 'other';
}

/** A span is considered failed if it is an exception item or has ERROR status. */
function spanFailed(r: TelemetryRecord): boolean {
  if (r.itemType === 'exception') return true;
  const code = r.customDimensions['otel.status_code'] ?? '';
  return code === 'STATUS_CODE_ERROR';
}

export function computeTraces(records: TelemetryRecord[]): Trace[] {
  const byTrace = new Map<string, TelemetryRecord[]>();
  for (const r of records) {
    const list = byTrace.get(r.operation_Id) ?? [];
    list.push(r);
    byTrace.set(r.operation_Id, list);
  }

  const traces: Trace[] = [];

  for (const [traceId, spansUnsorted] of Array.from(byTrace.entries())) {
    const spans = spansUnsorted.sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
    );

    // Root: span whose parent is the operation_Id itself (App Insights convention)
    // or whose parent is not any other span's id in this set.
    const idSet = new Set(spans.map((s) => s.id));
    const root =
      spans.find((s) => s.operation_ParentId === s.operation_Id) ??
      spans.find((s) => !s.operation_ParentId || !idSet.has(s.operation_ParentId)) ??
      spans[0];

    let llmCount = 0, toolCount = 0, agentCount = 0;
    let llmLatencySum = 0, llmLatencyN = 0;
    let inputTokens = 0, outputTokens = 0;
    let failureReason: string | null = null;
    let anyFailure = false;

    for (const s of spans) {
      const cat = categorizeSpan(s);
      if (cat === 'llm') {
        llmCount++;
        // gen_ai.client.operation.duration is in seconds
        const secStr = s.customDimensions['gen_ai.client.operation.duration'];
        if (secStr && secStr !== 'null') {
          const latMs = parseFloat(secStr) * 1000;
          if (isFinite(latMs) && latMs > 0) { llmLatencySum += latMs; llmLatencyN++; }
        } else if (s.duration > 0) {
          llmLatencySum += s.duration; llmLatencyN++;
        }
        const inp = parseInt(s.customDimensions['gen_ai.usage.input_tokens'] ?? '0', 10);
        const out = parseInt(s.customDimensions['gen_ai.usage.output_tokens'] ?? '0', 10);
        if (isFinite(inp)) inputTokens += inp;
        if (isFinite(out)) outputTokens += out;
      } else if (cat === 'tool') {
        toolCount++;
      } else if (cat === 'agent') {
        agentCount++;
      }

      if (spanFailed(s)) {
        anyFailure = true;
        if (!failureReason) {
          failureReason =
            s.customDimensions['error.message'] ??
            s.customDimensions['otel.status_code'] ??
            s.target ??
            null;
        }
      }
    }

    const firstStart = Date.parse(spans[0].timestamp);
    const lastEnd = Math.max(...spans.map((s) => Date.parse(s.timestamp) + s.duration));
    const durationMs = root.duration > 0 ? root.duration : lastEnd - firstStart;

    traces.push({
      traceId,
      rootSpanId: root.id,
      operationName: root.target || root.operation_Name || traceId,
      startTime: spans[0].timestamp,
      endTime: new Date(lastEnd).toISOString(),
      durationMs,
      spanCount: spans.length,
      success: !anyFailure,
      failureReason: anyFailure ? failureReason : null,
      llmCallCount: llmCount,
      toolCallCount: toolCount,
      agentCallCount: agentCount,
      avgLlmLatencyMs: llmLatencyN > 0 ? Math.round(llmLatencySum / llmLatencyN) : null,
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      conversationId: root.customDimensions['gen_ai.conversation.id'] ?? null,
      serviceName: root.customDimensions['service.name'] ?? null,
      spans,
    });
  }

  return traces.sort((a, b) => (a.startTime < b.startTime ? 1 : -1));
}

export function computeTraceKpis(traces: Trace[]): TraceKpis {
  const total = traces.length;
  if (total === 0) {
    return {
      totalTraces: 0, successfulTraces: 0, failedTraces: 0,
      traceSuccessRate: '0.0', avgTraceDurationMs: 0,
      avgSpansPerTrace: 0, avgLlmCallsPerTrace: 0,
      avgLlmLatencyMs: 0, totalLlmCalls: 0, totalToolCalls: 0,
      totalInputTokens: 0, totalOutputTokens: 0,
    };
  }

  const successful = traces.filter((t) => t.success).length;
  let durationSum = 0, spansSum = 0, llmCallsSum = 0, toolCallsSum = 0;
  let llmLatencyWeightedSum = 0, llmLatencyWeight = 0;
  let inputTokensTotal = 0, outputTokensTotal = 0;

  for (const t of traces) {
    durationSum  += t.durationMs;
    spansSum     += t.spanCount;
    llmCallsSum  += t.llmCallCount;
    toolCallsSum += t.toolCallCount;
    inputTokensTotal  += t.totalInputTokens;
    outputTokensTotal += t.totalOutputTokens;
    if (t.avgLlmLatencyMs !== null && t.llmCallCount > 0) {
      llmLatencyWeightedSum += t.avgLlmLatencyMs * t.llmCallCount;
      llmLatencyWeight      += t.llmCallCount;
    }
  }

  return {
    totalTraces: total,
    successfulTraces: successful,
    failedTraces: total - successful,
    traceSuccessRate: ((successful / total) * 100).toFixed(1),
    avgTraceDurationMs: Math.round(durationSum / total),
    avgSpansPerTrace: Math.round((spansSum / total) * 10) / 10,
    avgLlmCallsPerTrace: Math.round((llmCallsSum / total) * 10) / 10,
    avgLlmLatencyMs: llmLatencyWeight > 0 ? Math.round(llmLatencyWeightedSum / llmLatencyWeight) : 0,
    totalLlmCalls: llmCallsSum,
    totalToolCalls: toolCallsSum,
    totalInputTokens: inputTokensTotal,
    totalOutputTokens: outputTokensTotal,
  };
}

export function bucketTracesByHour(
  traces: Trace[],
): { hour: string; count: number; failures: number }[] {
  const map = new Map<string, { count: number; failures: number }>();
  for (const t of traces) {
    const hour = t.startTime.slice(0, 13);
    const bucket = map.get(hour) ?? { count: 0, failures: 0 };
    bucket.count++;
    if (!t.success) bucket.failures++;
    map.set(hour, bucket);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, { count, failures }]) => ({ hour, count, failures }));
}

export function errorRateTrend(
  traces: Trace[],
): { hour: string; errorRate: number }[] {
  return bucketTracesByHour(traces).map(({ hour, count, failures }) => ({
    hour,
    errorRate: count > 0 ? Math.round((failures / count) * 1000) / 10 : 0,
  }));
}

export function spanCategoryBreakdown(
  records: TelemetryRecord[],
): { category: SpanCategory; count: number }[] {
  const map = new Map<SpanCategory, number>();
  for (const r of records) {
    const cat = categorizeSpan(r);
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }
  const order: SpanCategory[] = ['llm', 'tool', 'agent', 'http', 'other'];
  return order.filter((c) => map.has(c)).map((category) => ({ category, count: map.get(category)! }));
}

export function toolUsageBreakdown(
  records: TelemetryRecord[],
): { tool: string; count: number; avgDurationMs: number }[] {
  const map = new Map<string, { count: number; totalDuration: number }>();
  for (const r of records) {
    if (categorizeSpan(r) !== 'tool') continue;
    const tool =
      r.customDimensions['gen_ai.tool.name'] ||
      r.target.replace(/^execute_tool\s+/i, '') ||
      'unknown';
    const entry = map.get(tool) ?? { count: 0, totalDuration: 0 };
    entry.count++;
    entry.totalDuration += r.duration;
    map.set(tool, entry);
  }
  return Array.from(map.entries())
    .map(([tool, { count, totalDuration }]) => ({
      tool,
      count,
      avgDurationMs: Math.round(totalDuration / count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function computeDerived(data: TelemetryRecord[]) {
  const traces    = computeTraces(data);
  const traceKpis = computeTraceKpis(traces);

  return {
    telemetryData: data,
    totalRequests: data.length,
    traces,
    traceKpis,
    spanCategoryData: spanCategoryBreakdown(data),
    toolUsageData: toolUsageBreakdown(data),
    traceTimelineData: bucketTracesByHour(traces),
    errorRateTrendData: errorRateTrend(traces),
    failedTraces: traces.filter((t) => !t.success),
    slowestTraces: [...traces].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10),
    truncated: false,
  };
}
