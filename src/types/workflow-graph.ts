// ── Raw workflow.definition shape ──

export interface WorkflowExecutor {
  id: string;
  type: string;
}

export interface WorkflowEdge {
  source_id: string;
  target_id: string;
}

export interface WorkflowCase {
  target_id: string;
  type: 'Case' | 'Default';
  condition_name?: string;
}

export interface WorkflowEdgeGroup {
  type: 'InternalEdgeGroup' | 'SwitchCaseEdgeGroup';
  edges: WorkflowEdge[];
  cases?: WorkflowCase[];
}

export interface WorkflowDefinition {
  id: string;
  start_executor_id: string;
  max_iterations: number;
  executors: Record<string, WorkflowExecutor>;
  edge_groups: WorkflowEdgeGroup[];
}

// ── Computed graph data for React Flow ──

export type ExecutorNodeShape = 'diamond' | 'rounded-rect';

export interface ExecutorNodeData extends Record<string, unknown> {
  executorId: string;
  executorType: string;
  shape: ExecutorNodeShape;
  isExecuted: boolean;
  isStartNode: boolean;
  spanCount?: number;
  totalDurationMs?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  functionInput?: string | null;
  functionOutput?: string | null;
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  edgeGroupType: string;
  caseType: 'Case' | 'Default' | null;
  conditionName: string | null;
  isExecuted: boolean;
  delivered?: boolean;
  confidence?: number | null;
  routedAgentName?: string | null;
}
