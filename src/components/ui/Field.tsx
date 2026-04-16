import JsonViewer from "@/components/trace-detail/JsonViewer";

export default function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'null') return null;
  const isJson = value.startsWith('{') || value.startsWith('[');
  return (
    <div className="py-1.5">
      <dt className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-xs text-gray-300 mt-0.5">
        {isJson ? <JsonViewer value={value} /> : value}
      </dd>
    </div>
  );
}
