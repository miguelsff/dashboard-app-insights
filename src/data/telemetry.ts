import type { SpanCategory, Trace, TraceKpis, TelemetryRecord } from '@/types/telemetry';

const BUCKET_ORDER = [
  '<250ms',
  '250ms-500ms',
  '500ms-1sec',
  '1sec-3sec',
  '3sec-7sec',
  '7sec-15sec',
  '15sec-30sec',
  '30sec-1min',
  '>=1min',
  '>=5min',
];

export function categorizeSpan(r: TelemetryRecord): SpanCategory {
  const typ  = (r.type ?? '').toLowerCase();
  const name = (r.name ?? '').toLowerCase();
  const op   = (r.customDimensions['gen_ai.operation.name'] ?? '').toLowerCase();

  if (op || typ.includes('openai') || typ.includes('llm') ||
      name.includes('chat.completions') || name.includes('embeddings')) return 'llm';
  if (op === 'execute_tool' || name.startsWith('tool.') ||
      r.customDimensions['gen_ai.function.output'] !== undefined) return 'tool';
  if (typ === 'http' || typ === 'https') return 'http';
  if (typ.includes('sql') || typ.includes('postgres') || typ.includes('mongo')) return 'db';
  return 'other';
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

    const idSet = new Set(spans.map((s) => s.id));
    const root = spans.find(
      (s) => !s.operation_ParentId || !idSet.has(s.operation_ParentId)
    ) ?? spans[0];

    let llmCount = 0, toolCount = 0, httpCount = 0;
    let llmLatencySum = 0, llmLatencyN = 0;
    let failureReason: string | null = null;
    let anyFailure = false;

    for (const s of spans) {
      const cat = categorizeSpan(s);
      if (cat === 'llm') {
        llmCount++;
        const lat = Number(s.customDimensions['gen_ai.response.latency_ms']);
        if (Number.isFinite(lat) && lat > 0) { llmLatencySum += lat; llmLatencyN++; }
      } else if (cat === 'tool') {
        toolCount++;
      } else if (cat === 'http') {
        httpCount++;
      }

      if (!s.success) {
        anyFailure = true;
        const msg = s.customDimensions['error.message'];
        if (msg && !failureReason) failureReason = msg;
      }
    }

    const firstStart = Date.parse(spans[0].timestamp);
    const lastEnd = Math.max(
      ...spans.map((s) => Date.parse(s.timestamp) + s.duration)
    );
    const durationMs = root.duration > 0 ? root.duration : (lastEnd - firstStart);

    traces.push({
      traceId,
      rootSpanId: root.id,
      operationName: root.operation_Name || root.name || traceId,
      startTime: spans[0].timestamp,
      endTime: new Date(lastEnd).toISOString(),
      durationMs,
      spanCount: spans.length,
      success: root.success,
      failureReason: anyFailure ? failureReason : null,
      llmCallCount: llmCount,
      toolCallCount: toolCount,
      httpCallCount: httpCount,
      avgLlmLatencyMs: llmLatencyN > 0 ? Math.round(llmLatencySum / llmLatencyN) : null,
      conversationId: root.customDimensions['gen_ai.conversation.id'] ?? null,
      sessionId: root.customDimensions['session.id'] ?? null,
      clientCity: root.client_City || null,
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
    };
  }

  const successful = traces.filter((t) => t.success).length;
  let durationSum = 0, spansSum = 0, llmCallsSum = 0, toolCallsSum = 0;
  let llmLatencyWeightedSum = 0, llmLatencyWeight = 0;

  for (const t of traces) {
    durationSum += t.durationMs;
    spansSum    += t.spanCount;
    llmCallsSum += t.llmCallCount;
    toolCallsSum += t.toolCallCount;
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
  };
}

export function bucketTracesByHour(
  traces: Trace[],
): { hour: string; count: number; failures: number }[] {
  const map = new Map<string, { count: number; failures: number }>();
  for (const t of traces) {
    const hour = t.startTime.slice(0, 13); // "2026-04-15T14"
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
  const order: SpanCategory[] = ['llm', 'tool', 'http', 'db', 'other'];
  return order.filter((c) => map.has(c)).map((category) => ({ category, count: map.get(category)! }));
}

export function toolUsageBreakdown(
  records: TelemetryRecord[],
): { tool: string; count: number; avgDurationMs: number }[] {
  const map = new Map<string, { count: number; totalDuration: number }>();
  for (const r of records) {
    if (categorizeSpan(r) !== 'tool') continue;
    const tool = r.name || 'unknown';
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

  // Legacy span-level metrics (kept for compatibility during migration)
  const totalRequests = data.length;
  const successCount  = data.filter((r) => r.success).length;
  const failureCount  = totalRequests - successCount;
  const avgDuration   = totalRequests > 0
    ? Math.round(data.reduce((sum, r) => sum + r.duration, 0) / totalRequests)
    : 0;
  const successRate = totalRequests > 0
    ? ((successCount / totalRequests) * 100).toFixed(1)
    : '0.0';

  const requestsByOperation = Object.entries(
    data.reduce<Record<string, number>>((acc, r) => {
      const key = r.customDimensions['gen_ai.operation.name'] ?? r.operation_Name;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));

  const bucketCounts = data.reduce<Record<string, number>>((acc, r) => {
    acc[r.performanceBucket] = (acc[r.performanceBucket] ?? 0) + 1;
    return acc;
  }, {});
  const requestsByBucket = BUCKET_ORDER.filter((b) => bucketCounts[b]).map((bucket) => ({
    bucket,
    count: bucketCounts[bucket],
  }));

  const successFailureData = [
    { name: 'Success', value: successCount },
    { name: 'Failure', value: failureCount },
  ];

  const timelineData = Object.entries(
    data.reduce<Record<string, number>>((acc, r) => {
      const minute = r.timestamp.slice(11, 16);
      acc[minute] = (acc[minute] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([minute, count]) => ({ minute, count }));

  const failedRecords = data.filter((r) => !r.success);

  return {
    telemetryData: data,
    totalRequests,
    successCount,
    failureCount,
    avgDuration,
    successRate,
    requestsByOperation,
    requestsByBucket,
    successFailureData,
    timelineData,
    failedRecords,
    // New trace-level data
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
