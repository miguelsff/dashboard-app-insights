export interface CustomDimensions {
  '_MS.ResourceAttributeId'?: string;
  'error.message'?: string;
  'gen_ai.conversation.id'?: string;
  'gen_ai.function.input.args'?: string;
  'gen_ai.function.input.kwargs'?: string;
  'gen_ai.function.output'?: string;
  'gen_ai.operation.name'?: string;
  'gen_ai.request.body_preview'?: string;
  'gen_ai.response.latency_ms'?: string;
  'gen_ai.service'?: string;
  'otel.parent_span_id'?: string;
  'otel.span_id'?: string;
  'otel.trace_id'?: string;
  'server.host'?: string;
  'service.type'?: string;
  'session.id'?: string;
  [key: string]: string | undefined;
}

export interface TelemetryRecord {
  timestamp: string;
  id: string;
  target: string;
  type: string;
  name: string;
  success: boolean;
  resultCode: string;
  duration: number;
  performanceBucket: string;
  itemType: string;
  customDimensions: CustomDimensions;
  operation_Name: string;
  operation_Id: string;
  operation_ParentId: string;
  client_Type: string;
  client_Model: string;
  client_OS: string;
  client_IP: string;
  client_City: string;
  client_StateOrProvince: string;
}

export type SpanCategory = 'llm' | 'tool' | 'http' | 'db' | 'other';

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
  httpCallCount: number;
  avgLlmLatencyMs: number | null;
  conversationId: string | null;
  sessionId: string | null;
  clientCity: string | null;
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
}
