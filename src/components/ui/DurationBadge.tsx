import { formatDuration } from "@/lib/format";

const THRESHOLD_DANGER = 15_000;
const THRESHOLD_WARNING = 5_000;

export default function DurationBadge({ ms }: { ms: number }) {
  const color =
    ms > THRESHOLD_DANGER ? "text-red-400"
    : ms > THRESHOLD_WARNING ? "text-yellow-400"
    : "text-emerald-400";
  return <span className={`font-mono text-xs ${color}`}>{formatDuration(ms)}</span>;
}
