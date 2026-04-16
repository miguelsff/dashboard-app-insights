import type {
  TelemetryRecord, Trace, SpanTreeNode, WaterfallSpanType,
  TraceDetailKpis, TraceMetadata, LlmCallTokenDatum,
  ToolCallRow, RoutingRow,
} from '@/types/telemetry';
import { isNullish, categorizeSpan, parseAdditionalProperties } from './telemetry';
import { estimateCost } from '@/lib/pricing';

function val(v: string | undefined): string | null {
  return isNullish(v) ? null : v!;
}

export function classifyWaterfallSpan(r: TelemetryRecord): WaterfallSpanType {
  const op = (r.customDimensions['gen_ai.operation.name'] ?? '').toLowerCase();
  if (op === 'chat') return 'chat';
  if (op === 'execute_tool') return 'execute_tool';
  if (op === 'invoke_agent') return 'invoke_agent';

  const t = (r.target ?? '').toLowerCase();
  if (t.startsWith('chat ')) return 'chat';
  if (t.startsWith('execute_tool ')) return 'execute_tool';
  if (t.startsWith('invoke_agent ')) return 'invoke_agent';
  if (t.startsWith('workflow.')) return 'workflow';
  if (t.startsWith('executor.')) return 'executor';
  if (t.startsWith('edge_group.')) return 'edge_group';
  if (t.startsWith('genai.http') || r.itemType === 'request') return 'http';
  return 'other';
}

export function buildSpanTree(spans: TelemetryRecord[]): SpanTreeNode[] {
  const byId = new Map(spans.map(s => [s.id, s]));
  const childrenMap = new Map<string, TelemetryRecord[]>();
  const roots: TelemetryRecord[] = [];

  for (const s of spans) {
    if (!s.operation_ParentId || !byId.has(s.operation_ParentId)) {
      roots.push(s);
    } else {
      const siblings = childrenMap.get(s.operation_ParentId) ?? [];
      siblings.push(s);
      childrenMap.set(s.operation_ParentId, siblings);
    }
  }

  const traceStart = Math.min(...spans.map(s => Date.parse(s.timestamp)));

  function buildNode(span: TelemetryRecord, depth: number): SpanTreeNode {
    const children = (childrenMap.get(span.id) ?? [])
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(child => buildNode(child, depth + 1));
    return {
      span,
      children,
      depth,
      offsetMs: Math.max(0, Date.parse(span.timestamp) - traceStart),
    };
  }

  return roots
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(r => buildNode(r, 0));
}

export function flattenTree(nodes: SpanTreeNode[]): SpanTreeNode[] {
  const result: SpanTreeNode[] = [];
  function walk(node: SpanTreeNode) {
    result.push(node);
    for (const child of node.children) walk(child);
  }
  for (const root of nodes) walk(root);
  return result;
}

export function computeTraceDetailKpis(trace: Trace): TraceDetailKpis {
  let totalInput = 0;
  let totalOutput = 0;
  const modelTokens: Record<string, { input: number; output: number }> = {};

  for (const s of trace.spans) {
    if (categorizeSpan(s) === 'llm') {
      const inp = parseInt(s.customDimensions['gen_ai.usage.input_tokens'] ?? '0', 10) || 0;
      const out = parseInt(s.customDimensions['gen_ai.usage.output_tokens'] ?? '0', 10) || 0;
      totalInput += inp;
      totalOutput += out;
      const model = s.customDimensions['gen_ai.request.model'] ?? 'unknown';
      if (!modelTokens[model]) modelTokens[model] = { input: 0, output: 0 };
      modelTokens[model].input += inp;
      modelTokens[model].output += out;
    }
  }

  let cost = 0;
  for (const [model, tokens] of Object.entries(modelTokens)) {
    cost += estimateCost(model, tokens.input, tokens.output);
  }

  return {
    traceId: trace.traceId,
    startTime: trace.startTime,
    durationMs: trace.durationMs,
    spanCount: trace.spanCount,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    estimatedCostUsd: cost,
  };
}

export function extractTraceMetadata(spans: TelemetryRecord[]): TraceMetadata {
  const meta: TraceMetadata = {
    sessionId: null, traceLink: null, agentId: null, agentVersion: null,
    serviceName: null, workflowId: null, workflowDefinition: null,
    endpointInput: null, endpointOutput: null, dacInput: null, dacOutput: null,
    httpStatus: null, streaming: null, sdkInfo: null, instrumentationInfo: null,
  };

  for (const s of spans) {
    const cd = s.customDimensions;
    if (!meta.sessionId) meta.sessionId = val(cd['custom_attrs.session_id']);
    if (!meta.traceLink) meta.traceLink = val(cd['custom_attrs.trace_link']);
    if (!meta.serviceName) meta.serviceName = val(cd['custom_attrs.service_name']) ?? val(cd['service.name']);
    if (!meta.workflowId) meta.workflowId = val(cd['workflow.id']);
    if (!meta.workflowDefinition) meta.workflowDefinition = val(cd['workflow.definition']);
    if (!meta.endpointInput) meta.endpointInput = val(cd['custom_endpoint.input']);
    if (!meta.endpointOutput) meta.endpointOutput = val(cd['custom_endpoint.output']);
    if (!meta.dacInput) meta.dacInput = val(cd['custom_endpoint.dac_input']) ?? val(cd['custom_function.dac_input']);
    if (!meta.dacOutput) meta.dacOutput = val(cd['custom_endpoint.dac_output']) ?? val(cd['custom_function.dac_output']);
    if (!meta.agentId || !meta.agentVersion) {
      const props = parseAdditionalProperties(cd['custom_attrs.additional_properties']);
      if (!meta.agentId && props.AGENT_ID) meta.agentId = props.AGENT_ID;
      if (!meta.agentVersion && props.AGENT_VERSION) meta.agentVersion = props.AGENT_VERSION;
    }
    if (!meta.sdkInfo) {
      const lang = val(cd['telemetry.sdk.language']);
      const name = val(cd['telemetry.sdk.name']);
      const ver = val(cd['telemetry.sdk.version']);
      if (name) meta.sdkInfo = [name, ver, lang ? `(${lang})` : ''].filter(Boolean).join(' ');
    }
    if (!meta.instrumentationInfo) {
      const name = val(cd['instrumentationlibrary.name']);
      const ver = val(cd['instrumentationlibrary.version']);
      if (name) meta.instrumentationInfo = [name, ver].filter(Boolean).join(' ');
    }
    if (!meta.httpStatus && val(cd['custom_endpoint.output'])) {
      try {
        const parsed = JSON.parse(cd['custom_endpoint.output']!);
        if (parsed.status_code) meta.httpStatus = String(parsed.status_code);
        if (parsed.streaming !== undefined) meta.streaming = String(parsed.streaming);
      } catch { /* ignore */ }
    }
  }

  return meta;
}

export function extractLlmCallTokens(spans: TelemetryRecord[], tree: SpanTreeNode[]): LlmCallTokenDatum[] {
  const parentMap = new Map<string, string>();
  function buildParentMap(nodes: SpanTreeNode[]) {
    for (const n of nodes) {
      for (const c of n.children) {
        parentMap.set(c.span.id, n.span.id);
        buildParentMap([c]);
      }
    }
  }
  buildParentMap(tree);

  const byId = new Map(spans.map(s => [s.id, s]));

  function findParentAgent(spanId: string): string {
    let current = spanId;
    while (parentMap.has(current)) {
      const parentId = parentMap.get(current)!;
      const parent = byId.get(parentId);
      if (parent) {
        const op = parent.customDimensions['gen_ai.operation.name'];
        if (op === 'invoke_agent') {
          return val(parent.customDimensions['gen_ai.agent.name']) ?? parent.target.replace(/^invoke_agent\s+/i, '');
        }
      }
      current = parentId;
    }
    return 'root';
  }

  const chatSpans = spans
    .filter(s => categorizeSpan(s) === 'llm')
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return chatSpans.map((s, i) => {
    const cd = s.customDimensions;
    const inp = parseInt(cd['gen_ai.usage.input_tokens'] ?? '0', 10) || 0;
    const out = parseInt(cd['gen_ai.usage.output_tokens'] ?? '0', 10) || 0;
    const secStr = cd['gen_ai.client.operation.duration'];
    let latMs = s.duration;
    if (!isNullish(secStr)) {
      const parsed = parseFloat(secStr!) * 1000;
      if (isFinite(parsed) && parsed > 0) latMs = parsed;
    }

    let finishReason = '';
    const raw = cd['gen_ai.response.finish_reasons'];
    if (!isNullish(raw)) {
      try { finishReason = JSON.parse(raw!).join(', '); } catch { finishReason = raw!; }
    }

    return {
      index: i + 1,
      label: s.target,
      parentAgent: findParentAgent(s.id),
      model: val(cd['gen_ai.request.model']) ?? 'unknown',
      inputTokens: inp,
      outputTokens: out,
      finishReason,
      llmLatencyMs: Math.round(latMs),
      temperature: val(cd['gen_ai.request.temperature']),
    };
  });
}

export function extractToolCalls(spans: TelemetryRecord[]): ToolCallRow[] {
  return spans
    .filter(s => categorizeSpan(s) === 'tool')
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(s => {
      const cd = s.customDimensions;
      return {
        toolName: val(cd['gen_ai.tool.name']) ?? s.target.replace(/^execute_tool\s+/i, ''),
        toolType: val(cd['gen_ai.tool.type']),
        callId: val(cd['gen_ai.tool.call.id']),
        arguments: val(cd['gen_ai.tool.call.arguments']),
        result: val(cd['gen_ai.tool.call.result']),
        durationMs: s.duration,
        status: cd['otel.status_code'] ?? 'UNSET',
        description: val(cd['gen_ai.tool.description']),
      };
    });
}

export function extractRoutingRows(spans: TelemetryRecord[]): RoutingRow[] {
  return spans
    .filter(s => {
      const t = (s.target ?? '').toLowerCase();
      return t.startsWith('workflow.') || t.startsWith('executor.') ||
             t.startsWith('edge_group.') || t.startsWith('message.');
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(s => {
      const cd = s.customDimensions;
      return {
        target: s.target,
        executorType: val(cd['executor.type']),
        executorId: val(cd['executor.id']),
        edgeGroupType: val(cd['edge_group.type']),
        delivered: val(cd['edge_group.delivered']),
        durationMs: s.duration,
        linkedSpans: val(cd['_MS.links']),
        output: val(cd['custom_function.output']),
      };
    });
}
