"use client";

import type { TraceMetadata } from "@/types/telemetry";
import CollapsibleSection from "./CollapsibleSection";
import JsonViewer from "./JsonViewer";

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  const isJson = value.startsWith('{') || value.startsWith('[');
  return (
    <tr className="border-b border-surface-700/50">
      <td className="py-2 pr-4 text-xs text-gray-500 font-medium whitespace-nowrap align-top">{label}</td>
      <td className="py-2 text-xs text-gray-300">
        {isJson ? <JsonViewer value={value} /> : <span className="break-all">{value}</span>}
      </td>
    </tr>
  );
}

export default function TraceMetadataPanel({ metadata }: { metadata: TraceMetadata }) {
  return (
    <CollapsibleSection title="Metadata">
      <table className="w-full">
        <tbody>
          <Row label="Session ID" value={metadata.sessionId} />
          <Row label="Trace Link" value={metadata.traceLink} />
          <Row label="Agent ID" value={metadata.agentId} />
          <Row label="Agent Version" value={metadata.agentVersion} />
          <Row label="Service Name" value={metadata.serviceName} />
          <Row label="Workflow ID" value={metadata.workflowId} />
          <Row label="Workflow Definition" value={metadata.workflowDefinition} />
          <Row label="Endpoint Input" value={metadata.endpointInput} />
          <Row label="Endpoint Output" value={metadata.endpointOutput} />
          <Row label="DAC Input" value={metadata.dacInput} />
          <Row label="DAC Output" value={metadata.dacOutput} />
          <Row label="HTTP Status" value={metadata.httpStatus} />
          <Row label="Streaming" value={metadata.streaming} />
          <Row label="SDK" value={metadata.sdkInfo} />
          <Row label="Instrumentation" value={metadata.instrumentationInfo} />
        </tbody>
      </table>
    </CollapsibleSection>
  );
}
