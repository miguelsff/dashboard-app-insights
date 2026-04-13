const FIELDS = [
  { label: "Resource Name", value: "app-ins-test-otel-collector" },
  { label: "Application ID", value: "2152aef0-1b2b-47fe-8eb3-c0c7fd290f13" },
  { label: "Service", value: "credicorp-dispatcher-middleware" },
  { label: "Location", value: "East US" },
  { label: "Ingestion Mode", value: "LogAnalytics" },
  { label: "Retention", value: "90 days" },
  { label: "App Type", value: "web · Redfield" },
  { label: "Data Window", value: "13 Apr 2026 · 05:03 – 05:47 UTC" },
] as const;

const OPERATIONS = ["agent-monitored-run", "create-session-post", "agent-route-post"] as const;
const AGENTS = ["Marvel/DC Comics", "Pokemon", "Digimon"] as const;

export default function ResourceInfoCard() {
  return (
    <div className="card">
      <p className="card-title">Resource Info</p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
        {FIELDS.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-sm text-gray-200 font-mono mt-0.5 truncate" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {OPERATIONS.map((op) => (
          <span key={op} className="px-2 py-0.5 rounded-full text-xs bg-azure-500/10 text-azure-400 border border-azure-500/20">
            {op}
          </span>
        ))}
        {AGENTS.map((agent) => (
          <span key={agent} className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {agent}
          </span>
        ))}
      </div>
    </div>
  );
}
