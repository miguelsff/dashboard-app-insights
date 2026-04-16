export default function StatusBadge({ status }: { status: "ok" | "error" | "unset" }) {
  if (status === "ok") return <span className="badge-success">OK</span>;
  if (status === "error") return <span className="badge-failure">ERROR</span>;
  return <span className="badge-neutral">UNSET</span>;
}
