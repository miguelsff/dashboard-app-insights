import { totalRequests, successCount, failureCount, avgDuration, successRate } from "@/data/telemetry";
import { formatDuration } from "@/lib/format";

const cards = [
  {
    label: "Total Requests",
    value: totalRequests.toString(),
    sub: "dependency records",
    color: "text-azure-400",
    bg: "bg-azure-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 17v-6h6v6m-3-9V5m0 0L9 8m3-3l3 3M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
      </svg>
    ),
  },
  {
    label: "Success Rate",
    value: `${successRate}%`,
    sub: `${successCount} of ${totalRequests} succeeded`,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Failures",
    value: failureCount.toString(),
    sub: "Ollama connection errors",
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  {
    label: "Avg Duration",
    value: formatDuration(avgDuration),
    sub: `${avgDuration.toLocaleString()}ms mean`,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function KpiCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, color, bg, icon }) => (
        <div key={label} className="card flex flex-col gap-3">
          <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
