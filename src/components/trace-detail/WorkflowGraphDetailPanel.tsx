"use client";

import type { ExecutorNodeData, WorkflowEdgeData } from '@/types/workflow-graph';
import { formatDuration, formatTokenCount } from '@/lib/format';
import JsonViewer from './JsonViewer';

type Selection =
  | { kind: 'node'; data: ExecutorNodeData }
  | { kind: 'edge'; data: WorkflowEdgeData; sourceId: string; targetId: string };

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  const isJson = value.startsWith('{') || value.startsWith('[');
  return (
    <div className="py-1.5">
      <dt className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-xs text-gray-300 mt-0.5">
        {isJson ? <JsonViewer value={value} /> : value}
      </dd>
    </div>
  );
}

function NodeDetail({ data }: { data: ExecutorNodeData }) {
  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
      <div>
        <Field label="Executor ID" value={data.executorId} />
        <Field label="Executor Type" value={data.executorType} />
        <Field label="Status" value={data.isExecuted ? 'Executed' : 'Not executed'} />
        {data.isStartNode && <Field label="Role" value="Start node" />}
      </div>
      {data.isExecuted && (
        <div>
          <Field label="Span Count" value={data.spanCount?.toString() ?? null} />
          <Field label="Duration" value={data.totalDurationMs != null ? formatDuration(data.totalDurationMs) : null} />
          <Field label="Input Tokens" value={data.totalInputTokens ? formatTokenCount(data.totalInputTokens) : null} />
          <Field label="Output Tokens" value={data.totalOutputTokens ? formatTokenCount(data.totalOutputTokens) : null} />
          <Field label="Function Input" value={data.functionInput} />
          <Field label="Function Output" value={data.functionOutput} />
        </div>
      )}
    </dl>
  );
}

function EdgeDetail({ data, sourceId, targetId }: { data: WorkflowEdgeData; sourceId: string; targetId: string }) {
  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
      <div>
        <Field label="Edge" value={`${sourceId} → ${targetId}`} />
        <Field label="Edge Group Type" value={data.edgeGroupType} />
        <Field label="Case Type" value={data.caseType} />
        <Field label="Condition" value={data.conditionName} />
      </div>
      <div>
        <Field label="Status" value={data.isExecuted ? 'Executed' : 'Not executed'} />
        {data.isExecuted && (
          <>
            <Field label="Delivered" value={data.delivered ? 'true' : 'false'} />
            <Field label="Routed Agent" value={data.routedAgentName} />
            <Field label="Confidence" value={data.confidence != null ? data.confidence.toString() : null} />
          </>
        )}
      </div>
    </dl>
  );
}

export default function WorkflowGraphDetailPanel({
  selection,
  onClose,
}: {
  selection: Selection | null;
  onClose: () => void;
}) {
  if (!selection) return null;

  return (
    <div className="mt-4 pt-4 border-t border-surface-600">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">
          {selection.kind === 'node'
            ? `Executor: ${selection.data.executorId}`
            : `Edge: ${selection.sourceId} → ${selection.targetId}`}
        </h4>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {selection.kind === 'node' ? (
        <NodeDetail data={selection.data} />
      ) : (
        <EdgeDetail data={selection.data} sourceId={selection.sourceId} targetId={selection.targetId} />
      )}
    </div>
  );
}
