import type { TelemetryRecord } from '@/types/telemetry';

const BUCKET_ORDER = [
  '<250ms',
  '250ms-500ms',
  '500ms-1sec',
  '1sec-3sec',
  '3sec-7sec',
  '7sec-15sec',
  '15sec-30sec',
  '30sec-1min',
  '>=1min',
  '>=5min',
];

export function computeDerived(data: TelemetryRecord[]) {
  const totalRequests = data.length;
  const successCount = data.filter((r) => r.success).length;
  const failureCount = totalRequests - successCount;
  const avgDuration =
    totalRequests > 0
      ? Math.round(data.reduce((sum, r) => sum + r.duration, 0) / totalRequests)
      : 0;
  const successRate =
    totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : '0.0';

  const requestsByOperation = Object.entries(
    data.reduce<Record<string, number>>((acc, r) => {
      const key = r.customDimensions['gen_ai.operation.name'] ?? r.operation_Name;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));

  const bucketCounts = data.reduce<Record<string, number>>((acc, r) => {
    acc[r.performanceBucket] = (acc[r.performanceBucket] ?? 0) + 1;
    return acc;
  }, {});
  const requestsByBucket = BUCKET_ORDER.filter((b) => bucketCounts[b]).map((bucket) => ({
    bucket,
    count: bucketCounts[bucket],
  }));

  const successFailureData = [
    { name: 'Success', value: successCount },
    { name: 'Failure', value: failureCount },
  ];

  const timelineData = Object.entries(
    data.reduce<Record<string, number>>((acc, r) => {
      const minute = r.timestamp.slice(11, 16);
      acc[minute] = (acc[minute] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([minute, count]) => ({ minute, count }));

  const failedRecords = data.filter((r) => !r.success);

  return {
    telemetryData: data,
    totalRequests,
    successCount,
    failureCount,
    avgDuration,
    successRate,
    requestsByOperation,
    requestsByBucket,
    successFailureData,
    timelineData,
    failedRecords,
  };
}
