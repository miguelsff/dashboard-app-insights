"use client";

import { useState } from "react";
import JsonViewer from "@/components/trace-detail/JsonViewer";

export default function ExpandableText({ text, maxLen = 60 }: { text: string | null; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-gray-600">—</span>;

  const isJson = text.startsWith('{') || text.startsWith('[');
  if (isJson) return <JsonViewer value={text} />;

  if (text.length <= maxLen) return <span className="text-gray-300 break-all">{text}</span>;

  return (
    <div>
      <span className="text-gray-300 break-all">
        {expanded ? text : `${text.slice(0, maxLen)}…`}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-azure-400 hover:text-azure-300 text-[10px]"
      >
        {expanded ? "less" : "more"}
      </button>
    </div>
  );
}
