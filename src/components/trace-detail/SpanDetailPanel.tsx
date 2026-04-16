"use client";

import type { TelemetryRecord, WaterfallSpanType } from "@/types/telemetry";
import { val } from "@/data/telemetry";
import { classifyWaterfallSpan } from "@/data/trace-detail";
import { formatDuration } from "@/lib/format";
import Field from "@/components/ui/Field";

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

interface FieldDef {
  label: string;
  key: string;
}

const TYPED_SECTIONS: Array<{
  types: WaterfallSpanType[];
  title: string;
  fields: FieldDef[];
}> = [
  {
    types: ['chat'],
    title: 'LLM',
    fields: [
      { label: 'Model', key: 'gen_ai.request.model' },
      { label: 'Input Tokens', key: 'gen_ai.usage.input_tokens' },
      { label: 'Output Tokens', key: 'gen_ai.usage.output_tokens' },
      { label: 'Temperature', key: 'gen_ai.request.temperature' },
      { label: 'Top P', key: 'gen_ai.request.top_p' },
      { label: 'Response ID', key: 'gen_ai.response.id' },
    ],
  },
  {
    types: ['invoke_agent'],
    title: 'Agent',
    fields: [
      { label: 'Agent Name', key: 'gen_ai.agent.name' },
      { label: 'Agent ID', key: 'gen_ai.agent.id' },
      { label: 'Provider', key: 'gen_ai.provider.name' },
      { label: 'Model', key: 'gen_ai.request.model' },
    ],
  },
  {
    types: ['execute_tool'],
    title: 'Tool',
    fields: [
      { label: 'Tool Name', key: 'gen_ai.tool.name' },
      { label: 'Tool Type', key: 'gen_ai.tool.type' },
      { label: 'Call ID', key: 'gen_ai.tool.call.id' },
      { label: 'Description', key: 'gen_ai.tool.description' },
      { label: 'Arguments', key: 'gen_ai.tool.call.arguments' },
      { label: 'Result', key: 'gen_ai.tool.call.result' },
    ],
  },
  {
    types: ['executor', 'edge_group'],
    title: 'Routing',
    fields: [
      { label: 'Executor Type', key: 'executor.type' },
      { label: 'Executor ID', key: 'executor.id' },
      { label: 'Edge Group Type', key: 'edge_group.type' },
      { label: 'Edge Delivered', key: 'edge_group.delivered' },
    ],
  },
];

const STATIC_SECTIONS: Array<{ title: string; fields: FieldDef[] }> = [
  {
    title: 'Function I/O',
    fields: [
      { label: 'Function Input', key: 'custom_function.input' },
      { label: 'Function Output', key: 'custom_function.output' },
      { label: 'DAC Input', key: 'custom_function.dac_input' },
      { label: 'DAC Output', key: 'custom_function.dac_output' },
    ],
  },
  {
    title: 'Endpoint I/O',
    fields: [
      { label: 'Endpoint Input', key: 'custom_endpoint.input' },
      { label: 'Endpoint Output', key: 'custom_endpoint.output' },
      { label: 'DAC Input', key: 'custom_endpoint.dac_input' },
      { label: 'DAC Output', key: 'custom_endpoint.dac_output' },
    ],
  },
  { title: 'Tools Available', fields: [{ label: 'Tool Definitions', key: 'gen_ai.tool.definitions' }] },
  { title: 'Span Links', fields: [{ label: '_MS.links', key: '_MS.links' }] },
];

function parseFinishReasons(raw: string | null): string | null {
  if (!raw) return null;
  try { return JSON.parse(raw).join(', '); } catch { return raw; }
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

  const finishReasons = parseFinishReasons(val(cd['gen_ai.response.finish_reasons']));
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

        {TYPED_SECTIONS
          .filter(s => s.types.includes(spanType))
          .map(section => (
            <Section key={section.title} title={section.title}>
              {section.title === 'LLM' && <Field label="LLM Latency" value={llmLatencyFormatted} />}
              {section.fields.map(f => (
                <Field key={f.key} label={f.label} value={val(cd[f.key])} />
              ))}
              {(section.title === 'LLM' || section.title === 'Agent') && (
                <Field label="Finish Reason" value={finishReasons} />
              )}
            </Section>
          ))}

        {STATIC_SECTIONS.map(section => (
          <Section key={section.title} title={section.title}>
            {section.fields.map(f => (
              <Field key={f.key} label={f.label} value={val(cd[f.key])} />
            ))}
          </Section>
        ))}
      </div>
    </div>
  );
}
