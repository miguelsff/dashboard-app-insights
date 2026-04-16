"use client";

import { useState } from "react";

function tryParse(raw: string): unknown {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') {
      try { return JSON.parse(parsed); } catch { return parsed; }
    }
    return parsed;
  } catch {
    return raw;
  }
}

export default function JsonViewer({ value }: { value: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!value || value === 'null') return <span className="text-gray-600">—</span>;

  const parsed = tryParse(value);
  const display = typeof parsed === 'object' && parsed !== null
    ? JSON.stringify(parsed, null, 2)
    : String(parsed);

  const handleCopy = () => {
    navigator.clipboard.writeText(display).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative group">
      <pre className="json-preview">{display}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded bg-surface-700 text-[10px] text-gray-400 hover:text-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
