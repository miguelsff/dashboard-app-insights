import type { Node, Edge } from '@xyflow/react';
import { Position } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import type { TelemetryRecord } from '@/types/telemetry';
import type {
  WorkflowDefinition, ExecutorNodeData, WorkflowEdgeData,
} from '@/types/workflow-graph';
import { isNullish, categorizeSpan } from './telemetry';

export interface WorkflowGraphData {
  nodes: Node<ExecutorNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
}

function parseDefinition(json: string): WorkflowDefinition | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === 'string') return JSON.parse(parsed);
    return parsed as WorkflowDefinition;
  } catch {
    return null;
  }
}

function executorShape(type: string): 'diamond' | 'rounded-rect' {
  const t = type.toLowerCase();
  return t.includes('dispatcher') || t.includes('classifier') ? 'diamond' : 'rounded-rect';
}

interface ExecutorStats {
  spanCount: number;
  totalDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  functionInput: string | null;
  functionOutput: string | null;
}

function computeExecutorStats(spans: TelemetryRecord[]): Map<string, ExecutorStats> {
  const stats = new Map<string, ExecutorStats>();

  for (const s of spans) {
    const t = (s.target ?? '').toLowerCase();
    if (!t.startsWith('executor.process')) continue;

    const execId = s.customDimensions['executor.id'];
    if (isNullish(execId)) continue;

    const entry = stats.get(execId!) ?? {
      spanCount: 0, totalDurationMs: 0, totalInputTokens: 0,
      totalOutputTokens: 0, functionInput: null, functionOutput: null,
    };
    entry.spanCount++;
    entry.totalDurationMs += s.duration;

    const fi = s.customDimensions['custom_function.input'];
    const fo = s.customDimensions['custom_function.output'];
    if (!isNullish(fi) && !entry.functionInput) entry.functionInput = fi!;
    if (!isNullish(fo) && !entry.functionOutput) entry.functionOutput = fo!;

    stats.set(execId!, entry);
  }

  for (const s of spans) {
    if (categorizeSpan(s) !== 'llm') continue;
    const parentTarget = spans.find(p =>
      s.operation_ParentId === p.id || spans.some(ep =>
        ep.operation_ParentId === p.id && ep.id === s.operation_ParentId
      )
    );
    if (!parentTarget) continue;
    for (const [execId, entry] of Array.from(stats.entries())) {
      const execSpan = spans.find(sp =>
        sp.target?.toLowerCase().startsWith('executor.process') &&
        sp.customDimensions['executor.id'] === execId
      );
      if (!execSpan) continue;
      const childSpans = getAllDescendantIds(spans, execSpan.id);
      if (childSpans.has(s.id)) {
        entry.totalInputTokens += parseInt(s.customDimensions['gen_ai.usage.input_tokens'] ?? '0', 10) || 0;
        entry.totalOutputTokens += parseInt(s.customDimensions['gen_ai.usage.output_tokens'] ?? '0', 10) || 0;
      }
    }
  }

  return stats;
}

function getAllDescendantIds(spans: TelemetryRecord[], parentId: string): Set<string> {
  const result = new Set<string>();
  const queue = [parentId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const s of spans) {
      if (s.operation_ParentId === current && !result.has(s.id)) {
        result.add(s.id);
        queue.push(s.id);
      }
    }
  }
  return result;
}

function getRoutingDecision(spans: TelemetryRecord[]): { agentName: string; confidence: number } | null {
  for (const s of spans) {
    const execType = s.customDimensions['executor.type'];
    if (!execType || !execType.toLowerCase().includes('dispatcher')) continue;
    const fo = s.customDimensions['custom_function.output'];
    if (isNullish(fo)) continue;
    try {
      const parsed = JSON.parse(fo!);
      if (parsed.agent_name && typeof parsed.confidence === 'number') {
        return { agentName: parsed.agent_name, confidence: parsed.confidence };
      }
    } catch { /* ignore */ }
  }
  return null;
}

function applyDagreLayout(nodes: Node<ExecutorNodeData>[], edges: Edge<WorkflowEdgeData>[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  for (const node of nodes) {
    const w = node.data.shape === 'diamond' ? 180 : 160;
    const h = node.data.shape === 'diamond' ? 80 : 60;
    g.setNode(node.id, { width: w, height: h });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  for (const node of nodes) {
    const pos = g.node(node.id);
    const w = node.data.shape === 'diamond' ? 180 : 160;
    const h = node.data.shape === 'diamond' ? 80 : 60;
    node.position = { x: pos.x - w / 2, y: pos.y - h / 2 };
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
  }
}

export function buildWorkflowGraph(
  spans: TelemetryRecord[],
  workflowDefinitionJson: string | null,
): WorkflowGraphData | null {
  if (!workflowDefinitionJson || isNullish(workflowDefinitionJson)) return null;
  const def = parseDefinition(workflowDefinitionJson);
  if (!def || !def.executors || !def.edge_groups) return null;

  const executorStats = computeExecutorStats(spans);
  const routing = getRoutingDecision(spans);
  const executedNodeIds = new Set(executorStats.keys());

  const nodes: Node<ExecutorNodeData>[] = Object.values(def.executors).map(exec => {
    const stats = executorStats.get(exec.id);
    return {
      id: exec.id,
      type: 'executorNode',
      position: { x: 0, y: 0 },
      data: {
        executorId: exec.id,
        executorType: exec.type,
        shape: executorShape(exec.type),
        isExecuted: executedNodeIds.has(exec.id),
        isStartNode: exec.id === def.start_executor_id,
        spanCount: stats?.spanCount,
        totalDurationMs: stats?.totalDurationMs,
        totalInputTokens: stats?.totalInputTokens,
        totalOutputTokens: stats?.totalOutputTokens,
        functionInput: stats?.functionInput,
        functionOutput: stats?.functionOutput,
      },
    };
  });

  const edges: Edge<WorkflowEdgeData>[] = [];
  for (const group of def.edge_groups) {
    if (group.type === 'InternalEdgeGroup') continue;
    const casesMap = new Map(
      (group.cases ?? []).map(c => [c.target_id, c]),
    );
    for (const e of group.edges) {
      const caseInfo = casesMap.get(e.target_id);
      const isExecuted = routing !== null && e.target_id === routing.agentName && executedNodeIds.has(e.source_id);
      edges.push({
        id: `${e.source_id}-${e.target_id}`,
        source: e.source_id,
        target: e.target_id,
        type: 'workflowEdge',
        data: {
          edgeGroupType: group.type,
          caseType: caseInfo?.type ?? null,
          conditionName: caseInfo?.condition_name ?? null,
          isExecuted,
          delivered: isExecuted ? true : undefined,
          confidence: isExecuted ? routing?.confidence : undefined,
          routedAgentName: isExecuted ? routing?.agentName : undefined,
        },
      });
    }
  }

  applyDagreLayout(nodes, edges);

  return { nodes, edges };
}
