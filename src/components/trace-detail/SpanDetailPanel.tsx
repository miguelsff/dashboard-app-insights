"use client";

import type { TelemetryRecord } from "@/types/telemetry";
import { isNullish } from "@/data/telemetry";
import { classifyWaterfallSpan } from "@/data/trace-detail";
import { formatDuration } from "@/lib/format";
import JsonViewer from "./JsonViewer";

function val(v: string | undefined): string | null {
  return isNullish(v) ? null : v!;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'null') return null;
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const hasContent = (Array.isArray(children) ? children : [children]).some(c => c !== null);
  if (!hasContent) return null;
  return (
    <div className="mb-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 pb-1 border-b border-surface-700/50">
        {title}
      </h4>
      <dl>{children}</dl>
    </div>
  );
}

export default function SpanDetailPanel({
  span,
  onClose,
}: {
  span: TelemetryRecord;
  onClose: () => void;
}) {
  const cd = span.customDimensions;
  const spanType = classifyWaterfallSpan(span);

  let finishReasons: string | null = null;
  const raw = val(cd['gen_ai.response.finish_reasons']);
  if (raw) {
    try { finishReasons = JSON.parse(raw).join(', '); } catch { finishReasons = raw; }
  }

  const llmLatency = val(cd['gen_ai.client.operation.duration']);
  const llmLatencyFormatted = llmLatency ? `${parseFloat(llmLatency).toFixed(3)}s` : null;

  return (
    <div className="mt-4 pt-4 border-t border-surface-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{span.target}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Section title="General">
          <Field label="Operation" value={val(cd['gen_ai.operation.name'])} />
          <Field label="Target" value={span.target} />
          <Field label="Duration" value={formatDuration(span.duration)} />
          <Field label="Status" value={val(cd['otel.status_code'])} />
          <Field label="Item Type" value={span.itemType} />
        </Section>

        {spanType === 'chat' && (
          <Section title="LLM">
            <Field label="Model" value={val(cd['gen_ai.request.model'])} />
            <Field label="LLM Latency" value={llmLatencyFormatted} />
            <Field label="Input Tokens" value={val(cd['gen_ai.usage.input_tokens'])} />
            <Field label="Output Tokens" value={val(cd['gen_ai.usage.output_tokens'])} />
            <Field label="Temperature" value={val(cd['gen_ai.request.temperature'])} />
            <Field label="Top P" value={val(cd['gen_ai.request.top_p'])} />
            <Field label="Finish Reason" value={finishReasons} />
            <Field label="Response ID" value={val(cd['gen_ai.response.id'])} />
          </Section>
        )}

        {spanType === 'invoke_agent' && (
          <Section title="Agent">
            <Field label="Agent Name" value={val(cd['gen_ai.agent.name'])} />
            <Field label="Agent ID" value={val(cd['gen_ai.agent.id'])} />
            <Field label="Provider" value={val(cd['gen_ai.provider.name'])} />
            <Field label="Model" value={val(cd['gen_ai.request.model'])} />
            <Field label="Finish Reason" value={finishReasons} />
          </Section>
        )}

        {spanType === 'execute_tool' && (
          <Section title="Tool">
            <Field label="Tool Name" value={val(cd['gen_ai.tool.name'])} />
            <Field label="Tool Type" value={val(cd['gen_ai.tool.type'])} />
            <Field label="Call ID" value={val(cd['gen_ai.tool.call.id'])} />
            <Field label="Description" value={val(cd['gen_ai.tool.description'])} />
            <Field label="Arguments" value={val(cd['gen_ai.tool.call.arguments'])} />
            <Field label="Result" value={val(cd['gen_ai.tool.call.result'])} />
          </Section>
        )}

        {(spanType === 'executor' || spanType === 'edge_group') && (
          <Section title="Routing">
            <Field label="Executor Type" value={val(cd['executor.type'])} />
            <Field label="Executor ID" value={val(cd['executor.id'])} />
            <Field label="Edge Group Type" value={val(cd['edge_group.type'])} />
            <Field label="Edge Delivered" value={val(cd['edge_group.delivered'])} />
          </Section>
        )}

        <Section title="Function I/O">
          <Field label="Function Input" value={val(cd['custom_function.input'])} />
          <Field label="Function Output" value={val(cd['custom_function.output'])} />
          <Field label="DAC Input" value={val(cd['custom_function.dac_input'])} />
          <Field label="DAC Output" value={val(cd['custom_function.dac_output'])} />
        </Section>

        <Section title="Endpoint I/O">
          <Field label="Endpoint Input" value={val(cd['custom_endpoint.input'])} />
          <Field label="Endpoint Output" value={val(cd['custom_endpoint.output'])} />
          <Field label="DAC Input" value={val(cd['custom_endpoint.dac_input'])} />
          <Field label="DAC Output" value={val(cd['custom_endpoint.dac_output'])} />
        </Section>

        <Section title="Tools Available">
          <Field label="Tool Definitions" value={val(cd['gen_ai.tool.definitions'])} />
        </Section>

        <Section title="Span Links">
          <Field label="_MS.links" value={val(cd['_MS.links'])} />
        </Section>
      </div>
    </div>
  );
}
