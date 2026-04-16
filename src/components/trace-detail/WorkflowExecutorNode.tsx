"use client";

import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ExecutorNodeData } from '@/types/workflow-graph';
import { WORKFLOW_GRAPH_COLORS } from '@/lib/chart-theme';

type ExecutorNodeProps = NodeProps<Node<ExecutorNodeData>>;

function DiamondNode({ data, selected }: { data: ExecutorNodeData; selected: boolean }) {
  const fill = data.isExecuted ? WORKFLOW_GRAPH_COLORS.executedNode : WORKFLOW_GRAPH_COLORS.nonExecutedNode;
  const ringClass = data.isStartNode ? 'drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]' : '';
  const selectedClass = selected ? 'drop-shadow-[0_0_8px_rgba(74,144,217,0.5)]' : '';

  return (
    <div className={`relative w-[180px] h-[80px] ${ringClass} ${selectedClass}`}>
      <svg viewBox="0 0 180 80" className="w-full h-full">
        <polygon
          points="90,4 176,40 90,76 4,40"
          fill={fill}
          stroke={data.isStartNode ? WORKFLOW_GRAPH_COLORS.startNodeRing : 'transparent'}
          strokeWidth={data.isStartNode ? 2.5 : 0}
        />
        <text
          x="90" y="36"
          textAnchor="middle"
          fill={WORKFLOW_GRAPH_COLORS.nodeText}
          fontSize="11"
          fontWeight="600"
        >
          {data.executorId}
        </text>
        <text
          x="90" y="50"
          textAnchor="middle"
          fill={WORKFLOW_GRAPH_COLORS.nodeSubtext}
          fontSize="9"
        >
          Dispatcher
        </text>
      </svg>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function RectNode({ data, selected }: { data: ExecutorNodeData; selected: boolean }) {
  const bg = data.isExecuted ? WORKFLOW_GRAPH_COLORS.executedNode : WORKFLOW_GRAPH_COLORS.nonExecutedNode;
  const border = data.isExecuted ? 'border-transparent' : 'border-gray-600';
  const startRing = data.isStartNode ? 'ring-2 ring-emerald-400' : '';
  const selectedRing = selected ? 'ring-2 ring-azure-400' : '';

  const shortType = data.executorType
    .replace('Executor', '')
    .replace(/([a-z])([A-Z])/g, '$1 $2');

  return (
    <div
      className={`w-[160px] h-[60px] rounded-lg border flex flex-col items-center justify-center ${border} ${startRing} ${selectedRing}`}
      style={{ backgroundColor: bg }}
    >
      <span className="text-[11px] font-semibold" style={{ color: WORKFLOW_GRAPH_COLORS.nodeText }}>
        {data.executorId}
      </span>
      <span className="text-[9px]" style={{ color: WORKFLOW_GRAPH_COLORS.nodeSubtext }}>
        {shortType}
      </span>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default function WorkflowExecutorNode({ data, selected }: ExecutorNodeProps) {
  if (data.shape === 'diamond') {
    return <DiamondNode data={data} selected={!!selected} />;
  }
  return <RectNode data={data} selected={!!selected} />;
}
