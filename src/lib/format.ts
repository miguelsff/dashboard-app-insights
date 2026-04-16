/**
 * Formats a duration in milliseconds into a human-readable string.
 * Uses the smallest unit that keeps one decimal place (m / s / ms).
 */
export function formatDuration(ms: number): string {
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

/**
 * Extracts HH:MM:SS from an ISO 8601 UTC string without allocating a Date object.
 * e.g. "2026-04-13T05:03:39.018Z" → "05:03:39 UTC"
 */
export function formatUtcTime(iso: string): string {
  return `${iso.slice(11, 19)} UTC`;
}

/**
 * Extracts HH:MM:SS.mmm from an ISO 8601 UTC string without allocating a Date object.
 * e.g. "2026-04-13T05:03:39.018Z" → "05:03:39.018"
 */
export function formatUtcTimeMs(iso: string): string {
  return iso.slice(11, 23);
}

export function formatCurrency(usd: number): string {
  if (usd < 0.01 && usd > 0) {
    return `$${usd.toFixed(4)}`;
  }
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatPercent(p: number): string {
  return `${p.toFixed(1)}%`;
}
