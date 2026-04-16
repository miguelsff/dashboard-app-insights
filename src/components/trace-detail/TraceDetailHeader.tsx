"use client";

import Link from "next/link";
import type { EnhancedTrace } from "@/types/telemetry";
import StatusBadge from "@/components/ui/StatusBadge";

export default function TraceDetailHeader({ trace }: { trace: EnhancedTrace }) {
  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Trace Detail</h1>
        <p className="text-sm text-gray-400 mt-1">
          {trace.operationName}
        </p>
      </div>
      <span className="mt-2">
        <StatusBadge status={trace.status} />
      </span>
    </header>
  );
}
