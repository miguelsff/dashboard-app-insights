"use client";

import { useMemo, useState, useCallback } from 'react';
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import type { Node, Edge, NodeMouseHandler, EdgeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { TelemetryRecord } from '@/types/telemetry';
import type { ExecutorNodeData, WorkflowEdgeData } from '@/types/workflow-graph';
import { buildWorkflowGraph } from '@/data/workflow-graph';
import WorkflowExecutorNode from './WorkflowExecutorNode';
import WorkflowEdge from './WorkflowEdge';
import WorkflowGraphDetailPanel from './WorkflowGraphDetailPanel';

type Selection =
  | { kind: 'node'; data: ExecutorNodeData }
  | { kind: 'edge'; data: WorkflowEdgeData; sourceId: string; targetId: string };

const nodeTypes = { executorNode: WorkflowExecutorNode };
const edgeTypes = { workflowEdge: WorkflowEdge };

function GraphCanvas({
  nodes,
  edges,
  selection,
  setSelection,
}: {
  nodes: Node<ExecutorNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
  selection: Selection | null;
  setSelection: (s: Selection | null) => void;
}) {
  const onNodeClick: NodeMouseHandler<Node<ExecutorNodeData>> = useCallback((_event, node) => {
    if (selection?.kind === 'node' && selection.data.executorId === node.data.executorId) {
      setSelection(null);
    } else {
      setSelection({ kind: 'node', data: node.data });
    }
  }, [selection, setSelection]);

  const onEdgeClick: EdgeMouseHandler<Edge<WorkflowEdgeData>> = useCallback((_event, edge) => {
    if (selection?.kind === 'edge' && edge.source === (selection as { sourceId: string }).sourceId && edge.target === (selection as { targetId: string }).targetId) {
      setSelection(null);
    } else if (edge.data) {
      setSelection({ kind: 'edge', data: edge.data, sourceId: edge.source, targetId: edge.target });
    }
  }, [selection, setSelection]);

  return (
    <div className="workflow-graph h-[420px] rounded-lg bg-surface-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll={false}
        zoomOnScroll={false}
        preventScrolling={false}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}

export default function WorkflowGraph({
  spans,
  workflowDefinitionJson,
}: {
  spans: TelemetryRecord[];
  workflowDefinitionJson: string | null;
}) {
  const graphData = useMemo(
    () => buildWorkflowGraph(spans, workflowDefinitionJson),
    [spans, workflowDefinitionJson],
  );
  const [selection, setSelection] = useState<Selection | null>(null);

  if (!graphData) return null;

  return (
    <div className="card">
      <h3 className="card-title">Workflow Graph — Camino Ejecutado</h3>
      <ReactFlowProvider>
        <GraphCanvas
          nodes={graphData.nodes}
          edges={graphData.edges}
          selection={selection}
          setSelection={setSelection}
        />
      </ReactFlowProvider>
      <WorkflowGraphDetailPanel
        selection={selection}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
