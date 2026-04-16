"use client";

import { useTelemetry } from "@/context/TelemetryContext";

const QUICK_RANGES = [
  { label: "24h", hours: 24 },
  { label: "7d",  hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

function toDateInput(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

export default function DateRangePicker() {
  const { dateRange, setDateRange, truncated, totalRequests, traces, isLoading } = useTelemetry();

  const startLocal = toDateInput(dateRange.startDate);
  const endLocal   = toDateInput(dateRange.endDate);

  function apply(start: string, end: string) {
    if (!start || !end) return;
    setDateRange({
      startDate: `${start}T00:00:00.000Z`,
      endDate:   `${end}T23:59:59.999Z`,
    });
  }

  function quickRange(hours: number) {
    const end   = new Date();
    const start = new Date(end.getTime() - hours * 3_600_000);
    setDateRange({ startDate: start.toISOString(), endDate: end.toISOString() });
  }

  const startDisplay = dateRange.startDate.slice(0, 10);
  const endDisplay   = dateRange.endDate.slice(0, 10);

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Start (UTC)</label>
          <input
            type="date"
            value={startLocal}
            max={endLocal}
            onChange={(e) => apply(e.target.value, endLocal)}
            className="bg-surface-900 border border-surface-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-azure-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">End (UTC)</label>
          <input
            type="date"
            value={endLocal}
            min={startLocal}
            onChange={(e) => apply(startLocal, e.target.value)}
            className="bg-surface-900 border border-surface-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-azure-500"
          />
        </div>
        <div className="flex gap-2 pb-0.5">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => quickRange(r.hours)}
              className="px-3 py-1.5 text-xs rounded border border-surface-700 text-gray-300 hover:bg-surface-700 hover:text-gray-100 transition-colors"
            >
              Last {r.label}
            </button>
          ))}
        </div>
        {!isLoading && (
          <p className="text-xs text-gray-500 pb-0.5 ml-auto">
            {startDisplay} → {endDisplay} · {traces.length} traces · {totalRequests} spans
          </p>
        )}
      </div>
      {truncated && (
        <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2">
          Results truncated at 5,000 spans — narrow the date range to see all data.
        </p>
      )}
    </div>
  );
}
