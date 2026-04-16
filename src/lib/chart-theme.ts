export const CATEGORY_COLORS = {
  llm:   '#a78bfa', // purple
  tool:  '#22d3ee', // cyan
  agent: '#34d399', // emerald
  http:  '#60a5fa', // blue
  other: '#6b7280', // gray
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#0f1629",
    border: "1px solid #1a2340",
    borderRadius: "8px",
    color: "#f3f4f6",
    fontSize: "12px",
  },
  labelStyle: { color: "#9ca3af" },
} as const;

export const AXIS_TICK = { fill: "#9ca3af", fontSize: 11 } as const;

export const AXIS_BASE = { axisLine: false, tickLine: false } as const;

export const GRID_PROPS = {
  strokeDasharray: "3 3",
  stroke: "#1a2340",
} as const;

export const VISTA1_COLORS = {
  p50: '#60a5fa',
  p95: '#f59e0b',
  inputTokens: '#a78bfa',
  outputTokens: '#22d3ee',
  llmTime: '#a78bfa',
  orchestrationTime: '#34d399',
} as const;

export const FINISH_REASON_COLORS: Record<string, string> = {
  stop: '#34d399',
  tool_calls: '#22d3ee',
  length: '#f59e0b',
  content_filter: '#ef4444',
  error: '#ef4444',
};

export const MODEL_COLORS: Record<string, string> = {
  'gpt-4o-mini': '#60a5fa',
  'gpt-4o': '#a78bfa',
  'gpt-4': '#f59e0b',
};

export const WORKFLOW_GRAPH_COLORS = {
  executedNode: '#4A90D9',
  nonExecutedNode: '#374151',
  executedEdge: '#4A90D9',
  nonExecutedEdge: '#6B7280',
  startNodeRing: '#34d399',
  nodeText: '#F3F4F6',
  nodeSubtext: '#9CA3AF',
} as const;

export const CHART_MARGIN = { top: 5, right: 20, bottom: 5, left: 10 } as const;
export const CHART_MARGIN_WIDE = { top: 5, right: 20, bottom: 5, left: 100 } as const;
export const CHART_MARGIN_COMPACT = { top: 4, right: 16, left: 0, bottom: 0 } as const;
export const LEGEND_STYLE = { fontSize: 11, color: "#9ca3af" } as const;

export const WATERFALL_COLORS: Record<string, string> = {
  chat: '#4A90D9',
  execute_tool: '#E8A838',
  invoke_agent: '#7B68EE',
  workflow: '#6B7280',
  executor: '#9CA3AF',
  edge_group: '#D1D5DB',
  http: '#10B981',
  other: '#4B5563',
};
