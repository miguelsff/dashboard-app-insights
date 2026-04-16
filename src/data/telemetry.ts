import type {
  SpanCategory, Trace, TraceKpis, TelemetryRecord,
  GlobalFilters, FilterOptions, ParsedAdditionalProperties,
  Vista1Kpis, EnhancedTrace,
  LatencyTimePoint, FinishReasonDatum, TokensByDayDatum,
  CostByModelDatum, AgentInvocationDatum, StageDurationDatum,
  LlmVsOrchestrationDatum,
} from '@/types/telemetry';
import { estimateCost } from '@/lib/pricing';

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

// ── Vista 1 helpers ──────────────────────────────────────────────────────

export function isNullish(v: string | undefined): boolean {
  return !v || v === 'null';
}

export function parseAdditionalProperties(raw: string | undefined): ParsedAdditionalProperties {
  if (isNullish(raw)) return {};
  const result: ParsedAdditionalProperties = {};
  for (const pair of raw!.split(',')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx > 0) {
      result[pair.slice(0, colonIdx).trim()] = pair.slice(colonIdx + 1).trim();
    }
  }
  return result;
}

export function extractFilterOptions(records: TelemetryRecord[]): FilterOptions {
  const models = new Set<string>();
  const agents = new Set<string>();
  const services = new Set<string>();
  const versions = new Set<string>();
  const statuses = new Set<string>();

  for (const r of records) {
    const cd = r.customDimensions;
    if (!isNullish(cd['gen_ai.request.model'])) models.add(cd['gen_ai.request.model']!);
    if (!isNullish(cd['gen_ai.agent.name'])) agents.add(cd['gen_ai.agent.name']!);
    if (!isNullish(cd['custom_attrs.service_name'])) services.add(cd['custom_attrs.service_name']!);
    const props = parseAdditionalProperties(cd['custom_attrs.additional_properties']);
    if (props.AGENT_VERSION) versions.add(props.AGENT_VERSION);
    const status = cd['otel.status_code'];
    if (status) statuses.add(status);
  }

  return {
    models: Array.from(models).sort(),
    agents: Array.from(agents).sort(),
    services: Array.from(services).sort(),
    agentVersions: Array.from(versions).sort(),
    statuses: Array.from(statuses).sort(),
  };
}

export function applyGlobalFilters(records: TelemetryRecord[], filters: GlobalFilters): TelemetryRecord[] {
  return records.filter((r) => {
    const cd = r.customDimensions;
    if (filters.models.length > 0) {
      const model = cd['gen_ai.request.model'];
      if (!isNullish(model) && !filters.models.includes(model!)) return false;
    }
    if (filters.agents.length > 0) {
      const agent = cd['gen_ai.agent.name'];
      if (!isNullish(agent) && !filters.agents.includes(agent!)) return false;
    }
    if (filters.services.length > 0) {
      const svc = cd['custom_attrs.service_name'];
      if (!isNullish(svc) && !filters.services.includes(svc!)) return false;
    }
    if (filters.agentVersion) {
      const props = parseAdditionalProperties(cd['custom_attrs.additional_properties']);
      if (props.AGENT_VERSION && props.AGENT_VERSION !== filters.agentVersion) return false;
    }
    if (filters.status) {
      const status = cd['otel.status_code'] ?? '';
      if (status && status !== filters.status) return false;
    }
    return true;
  });
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export function computeVista1Kpis(traces: Trace[], records: TelemetryRecord[]): Vista1Kpis {
  const e2eDurations = records
    .filter(r => r.target === 'genai.http POST /api/chat')
    .map(r => r.duration);

  let totalInput = 0;
  let totalOutput = 0;
  const modelTokens: Record<string, { input: number; output: number }> = {};

  for (const r of records) {
    if (categorizeSpan(r) === 'llm') {
      const inp = parseInt(r.customDimensions['gen_ai.usage.input_tokens'] ?? '0', 10) || 0;
      const out = parseInt(r.customDimensions['gen_ai.usage.output_tokens'] ?? '0', 10) || 0;
      totalInput += inp;
      totalOutput += out;
      const model = r.customDimensions['gen_ai.request.model'] ?? 'unknown';
      if (!modelTokens[model]) modelTokens[model] = { input: 0, output: 0 };
      modelTokens[model].input += inp;
      modelTokens[model].output += out;
    }
  }

  let totalCost = 0;
  for (const [model, tokens] of Object.entries(modelTokens)) {
    totalCost += estimateCost(model, tokens.input, tokens.output);
  }

  const toolSpans = records.filter(r => categorizeSpan(r) === 'tool');
  const toolErrors = toolSpans.filter(r =>
    r.customDimensions['otel.status_code'] === 'STATUS_CODE_ERROR' || r.itemType === 'exception',
  );
  const toolSuccessRate = toolSpans.length > 0
    ? ((toolSpans.length - toolErrors.length) / toolSpans.length) * 100
    : 100;

  return {
    totalTraces: traces.length,
    e2eDurationP50Ms: percentile(e2eDurations, 50),
    e2eDurationP95Ms: percentile(e2eDurations, 95),
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    estimatedCostUsd: totalCost,
    toolCallSuccessRate: toolSuccessRate,
    toolCallTotal: toolSpans.length,
    toolCallSuccess: toolSpans.length - toolErrors.length,
  };
}

export function computeEnhancedTraces(traces: Trace[]): EnhancedTrace[] {
  return traces.map(t => {
    const modelsSet = new Set<string>();
    const agentsSet = new Set<string>();
    let sessionId: string | null = null;
    let agentVersion: string | null = null;
    let traceLink: string | null = null;
    let hasError = false;
    let hasOk = false;

    for (const s of t.spans) {
      const cd = s.customDimensions;
      if (!isNullish(cd['gen_ai.request.model'])) modelsSet.add(cd['gen_ai.request.model']!);
      if (!isNullish(cd['gen_ai.agent.name'])) agentsSet.add(cd['gen_ai.agent.name']!);
      if (!sessionId && !isNullish(cd['custom_attrs.session_id'])) sessionId = cd['custom_attrs.session_id']!;
      if (!agentVersion) {
        const props = parseAdditionalProperties(cd['custom_attrs.additional_properties']);
        if (props.AGENT_VERSION) agentVersion = props.AGENT_VERSION;
      }
      if (!traceLink && !isNullish(cd['custom_attrs.trace_link'])) traceLink = cd['custom_attrs.trace_link']!;
      if (cd['otel.status_code'] === 'STATUS_CODE_ERROR') hasError = true;
      if (cd['otel.status_code'] === 'STATUS_CODE_OK') hasOk = true;
    }

    const status: 'ok' | 'error' | 'unset' = hasError ? 'error' : hasOk ? 'ok' : 'unset';

    return { ...t, sessionId, agentVersion, models: Array.from(modelsSet), agents: Array.from(agentsSet), traceLink, status };
  });
}

export function computeLatencyTimeSeries(records: TelemetryRecord[]): LatencyTimePoint[] {
  const byDay = new Map<string, number[]>();
  for (const r of records) {
    if (r.target !== 'genai.http POST /api/chat') continue;
    const day = r.timestamp.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(r.duration);
    byDay.set(day, list);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, durations]) => ({
      day,
      p50Ms: Math.round(percentile(durations, 50)),
      p95Ms: Math.round(percentile(durations, 95)),
    }));
}

export function computeFinishReasons(records: TelemetryRecord[]): FinishReasonDatum[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    if (categorizeSpan(r) !== 'llm') continue;
    const raw = r.customDimensions['gen_ai.response.finish_reasons'];
    if (isNullish(raw)) continue;
    try {
      const arr = JSON.parse(raw!) as string[];
      for (const reason of arr) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      }
    } catch {
      counts.set(raw!, (counts.get(raw!) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeTokensByDay(records: TelemetryRecord[]): TokensByDayDatum[] {
  const byDay = new Map<string, { input: number; output: number }>();
  for (const r of records) {
    if (categorizeSpan(r) !== 'llm') continue;
    const day = r.timestamp.slice(0, 10);
    const entry = byDay.get(day) ?? { input: 0, output: 0 };
    entry.input += parseInt(r.customDimensions['gen_ai.usage.input_tokens'] ?? '0', 10) || 0;
    entry.output += parseInt(r.customDimensions['gen_ai.usage.output_tokens'] ?? '0', 10) || 0;
    byDay.set(day, entry);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, { input, output }]) => ({ day, inputTokens: input, outputTokens: output }));
}

export function computeCostByModel(records: TelemetryRecord[]): CostByModelDatum[] {
  const byModel = new Map<string, { input: number; output: number }>();
  for (const r of records) {
    if (categorizeSpan(r) !== 'llm') continue;
    const model = r.customDimensions['gen_ai.request.model'] ?? 'unknown';
    const entry = byModel.get(model) ?? { input: 0, output: 0 };
    entry.input += parseInt(r.customDimensions['gen_ai.usage.input_tokens'] ?? '0', 10) || 0;
    entry.output += parseInt(r.customDimensions['gen_ai.usage.output_tokens'] ?? '0', 10) || 0;
    byModel.set(model, entry);
  }
  return Array.from(byModel.entries()).map(([model, tokens]) => ({
    model,
    costInput: estimateCost(model, tokens.input, 0),
    costOutput: estimateCost(model, 0, tokens.output),
  }));
}

export function computeAgentInvocations(records: TelemetryRecord[]): AgentInvocationDatum[] {
  const byAgent = new Map<string, { count: number; totalDuration: number }>();
  for (const r of records) {
    const op = r.customDimensions['gen_ai.operation.name'];
    if (op !== 'invoke_agent') continue;
    const agent = r.customDimensions['gen_ai.agent.name'] ?? r.target.replace(/^invoke_agent\s+/i, '') ?? 'unknown';
    const entry = byAgent.get(agent) ?? { count: 0, totalDuration: 0 };
    entry.count++;
    entry.totalDuration += r.duration;
    byAgent.set(agent, entry);
  }
  return Array.from(byAgent.entries())
    .map(([agent, { count, totalDuration }]) => ({
      agent,
      count,
      avgDurationMs: Math.round(totalDuration / count),
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeAvgDurationByStage(records: TelemetryRecord[]): StageDurationDatum[] {
  const byStage = new Map<string, { total: number; count: number }>();
  for (const r of records) {
    const op = r.customDimensions['gen_ai.operation.name'];
    let stage: string;
    if (op === 'chat') stage = 'chat (LLM)';
    else if (op === 'execute_tool') stage = 'execute_tool';
    else if (op === 'invoke_agent') stage = 'invoke_agent';
    else {
      const t = r.target.toLowerCase();
      if (t.startsWith('workflow.')) stage = r.target.split(' ')[0];
      else if (t.startsWith('executor.')) stage = 'executor.process';
      else if (t.startsWith('edge_group.')) stage = 'edge_group.process';
      else if (t.startsWith('message.')) stage = 'message.send';
      else if (t.startsWith('genai.http')) stage = 'genai.http (E2E)';
      else if (t.includes('.e2e')) stage = 'e2e';
      else continue;
    }
    const entry = byStage.get(stage) ?? { total: 0, count: 0 };
    entry.total += r.duration;
    entry.count++;
    byStage.set(stage, entry);
  }
  return Array.from(byStage.entries())
    .map(([stage, { total, count }]) => ({
      stage,
      avgDurationMs: Math.round(total / count),
    }))
    .sort((a, b) => b.avgDurationMs - a.avgDurationMs);
}

export function computeLlmVsOrchestration(records: TelemetryRecord[]): LlmVsOrchestrationDatum[] {
  let llmMs = 0;
  const e2eSpans = records.filter(r => r.target === 'genai.http POST /api/chat');
  const totalE2eMs = e2eSpans.reduce((sum, r) => sum + r.duration, 0);

  for (const r of records) {
    if (categorizeSpan(r) !== 'llm') continue;
    const secStr = r.customDimensions['gen_ai.client.operation.duration'];
    if (!isNullish(secStr)) {
      const ms = parseFloat(secStr!) * 1000;
      if (isFinite(ms) && ms > 0) { llmMs += ms; continue; }
    }
    llmMs += r.duration;
  }

  const orchMs = Math.max(0, totalE2eMs - llmMs);
  return [
    { name: 'LLM', durationMs: Math.round(llmMs) },
    { name: 'Orquestación', durationMs: Math.round(orchMs) },
  ];
}

export function computeDerived(data: TelemetryRecord[]) {
  const traces    = computeTraces(data);
  const traceKpis = computeTraceKpis(traces);
  const vista1Kpis = computeVista1Kpis(traces, data);
  const enhancedTraces = computeEnhancedTraces(traces);

  return {
    telemetryData: data,
    totalRequests: data.length,
    traces,
    enhancedTraces,
    traceKpis,
    vista1Kpis,
    filterOptions: extractFilterOptions(data),
    spanCategoryData: spanCategoryBreakdown(data),
    toolUsageData: toolUsageBreakdown(data),
    traceTimelineData: bucketTracesByHour(traces),
    errorRateTrendData: errorRateTrend(traces),
    failedTraces: traces.filter((t) => !t.success),
    slowestTraces: [...traces].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10),
    latencyTimeSeriesData: computeLatencyTimeSeries(data),
    finishReasonsData: computeFinishReasons(data),
    tokensByDayData: computeTokensByDay(data),
    costByModelData: computeCostByModel(data),
    agentInvocationsData: computeAgentInvocations(data),
    stageDurationData: computeAvgDurationByStage(data),
    llmVsOrchestrationData: computeLlmVsOrchestration(data),
    truncated: false,
  };
}
