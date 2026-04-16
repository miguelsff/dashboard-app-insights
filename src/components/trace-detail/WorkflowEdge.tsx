"use client";

import {
  BaseEdge, EdgeLabelRenderer, getSmoothStepPath,
} from '@xyflow/react';
import type { EdgeProps, Edge } from '@xyflow/react';
import type { WorkflowEdgeData } from '@/types/workflow-graph';
import { WORKFLOW_GRAPH_COLORS } from '@/lib/chart-theme';

type WorkflowEdgeProps = EdgeProps<Edge<WorkflowEdgeData>>;

export default function WorkflowEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: WorkflowEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 8,
  });

  const isExecuted = data?.isExecuted ?? false;
  const stroke = isExecuted ? WORKFLOW_GRAPH_COLORS.executedEdge : WORKFLOW_GRAPH_COLORS.nonExecutedEdge;
  const strokeWidth = isExecuted ? 2.5 : 1.5;
  const strokeDasharray = isExecuted ? undefined : '6 3';

  const labels: string[] = [];
  if (data?.caseType === 'Default') labels.push('Default');
  if (isExecuted && data?.routedAgentName && data?.confidence != null) {
    labels.push(`conf: ${data.confidence}`);
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth,
          strokeDasharray,
          cursor: 'pointer',
        }}
        markerEnd={`url(#marker-${isExecuted ? 'executed' : 'default'})`}
      />
      {labels.length > 0 && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {labels.map((label, i) => (
              <span
                key={i}
                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  isExecuted && label.startsWith('conf')
                    ? 'bg-azure-500/20 text-azure-400'
                    : 'bg-surface-700 text-gray-400'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </EdgeLabelRenderer>
      )}
      <defs>
        <marker
          id="marker-executed"
          viewBox="0 0 10 10"
          refX="10" refY="5"
          markerWidth="8" markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={WORKFLOW_GRAPH_COLORS.executedEdge} />
        </marker>
        <marker
          id="marker-default"
          viewBox="0 0 10 10"
          refX="10" refY="5"
          markerWidth="8" markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={WORKFLOW_GRAPH_COLORS.nonExecutedEdge} />
        </marker>
      </defs>
    </>
  );
}
