export interface CustomDimensions {
  // GenAI — agent
  'gen_ai.agent.name'?: string;
  'gen_ai.agent.id'?: string;
  'gen_ai.provider.name'?: string;
  'gen_ai.conversation.id'?: string;
  // GenAI — operation
  'gen_ai.operation.name'?: string;
  'gen_ai.client.operation.duration'?: string; // seconds as string
  // GenAI — request
  'gen_ai.request.model'?: string;
  'gen_ai.request.temperature'?: string;
  'gen_ai.request.top_p'?: string;
  'gen_ai.request.choice.count'?: string;
  'gen_ai.request.body.preview'?: string;
  'gen_ai.system.instructions'?: string;
  // GenAI — response
  'gen_ai.response.finish_reasons'?: string;
  'gen_ai.response.id'?: string;
  // GenAI — tool
  'gen_ai.tool.name'?: string;
  'gen_ai.tool.type'?: string;
  'gen_ai.tool.description'?: string;
  'gen_ai.tool.call.id'?: string;
  'gen_ai.tool.call.arguments'?: string;
  'gen_ai.tool.call.result'?: string;
  'gen_ai.tool.definitions'?: string;
  // GenAI — usage
  'gen_ai.usage.input_tokens'?: string;
  'gen_ai.usage.output_tokens'?: string;
  // OTel
  'otel.status_code'?: string; // e.g. "STATUS_CODE_UNSET" | "STATUS_CODE_OK" | "STATUS_CODE_ERROR"
  // Service
  'service.name'?: string;
  'service.type'?: string;
  // Instrumentation
  'instrumentationlibrary.name'?: string;
  'instrumentationlibrary.version'?: string;
  'telemetry.sdk.language'?: string;
  'telemetry.sdk.name'?: string;
  'telemetry.sdk.version'?: string;
  // Custom app attributes
  'custom_attrs.additional_properties'?: string;
  'custom_attrs.operation_name'?: string;
  'custom_attrs.otel_sink_server'?: string;
  'custom_attrs.service_name'?: string;
  'custom_attrs.trace_link'?: string;
  [key: string]: string | undefined;
}

/** A single span row returned by the KQL query (union of dependencies/requests/traces/exceptions). */
export interface TelemetryRecord {
  timestamp: string;        // ISO 8601 UTC
  id: string;               // span ID
  target: string;           // span display name, e.g. "chat gpt-4o-mini"
  itemType: string;         // "dependency" | "request" | "trace" | "exception"
  customDimensions: CustomDimensions;
  operation_Name: string;
  operation_Id: string;     // trace ID
  operation_ParentId: string;
  duration: number;         // ms
}

export type SpanCategory = 'llm' | 'tool' | 'agent' | 'http' | 'other';

export interface DateRange {
  startDate: string; // ISO 8601
  endDate: string;
}

export interface TelemetryApiResponse {
  records: TelemetryRecord[];
  truncated: boolean;
  totalReturned: number;
  dateRange: DateRange;
}

export interface Trace {
  traceId: string;
  rootSpanId: string | null;
  operationName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  spanCount: number;
  success: boolean;
  failureReason: string | null;
  llmCallCount: number;
  toolCallCount: number;
  agentCallCount: number;
  avgLlmLatencyMs: number | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  conversationId: string | null;
  serviceName: string | null;
  spans: TelemetryRecord[];
}

export interface TraceKpis {
  totalTraces: number;
  successfulTraces: number;
  failedTraces: number;
  traceSuccessRate: string;
  avgTraceDurationMs: number;
  avgSpansPerTrace: number;
  avgLlmCallsPerTrace: number;
  avgLlmLatencyMs: number;
  totalLlmCalls: number;
  totalToolCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}
