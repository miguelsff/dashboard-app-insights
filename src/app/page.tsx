"use client";

import { TelemetryProvider, useTelemetry } from "@/context/TelemetryContext";
import DateRangePicker from "@/components/DateRangePicker";
import KpiCards from "@/components/KpiCards";
import TraceTimelineChart from "@/components/TraceTimelineChart";
import SpanCategoryChart from "@/components/SpanCategoryChart";
import ToolUsageChart from "@/components/ToolUsageChart";
import ErrorRateTrendChart from "@/components/ErrorRateTrendChart";
import SlowestTracesCard from "@/components/SlowestTracesCard";
import FailedTracesPanel from "@/components/FailedTracesPanel";
import TraceTable from "@/components/TraceTable";

function DashboardHeader() {
  const { lastUpdated, fetchError, errorMessage, isLoading } = useTelemetry();
  const updatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toISOString().slice(11, 19)} UTC`
    : isLoading ? "Loading…" : "—";

  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">LLM Agent Telemetry</h1>
        <p className="text-sm text-gray-400 mt-1">Trace-level analysis &middot; Azure Application Insights</p>
      </div>
      <div className="flex flex-col items-end gap-1 mt-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${fetchError ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`}
          />
          <span className="text-xs text-gray-500 font-mono">{updatedLabel}</span>
        </div>
        {fetchError && errorMessage && (
          <span className="text-xs text-red-400 font-mono">{errorMessage}</span>
        )}
      </div>
    </header>
  );
}

export default function DashboardPage() {
  return (
    <TelemetryProvider>
      <main className="max-w-screen-2xl mx-auto px-4 py-8 space-y-5">
        <DashboardHeader />
        <DateRangePicker />
        <KpiCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TraceTimelineChart />
          </div>
          <SpanCategoryChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ToolUsageChart />
          <ErrorRateTrendChart />
        </div>

        <SlowestTracesCard />
        <FailedTracesPanel />
        <TraceTable />

        <footer className="text-center text-xs text-gray-700 py-4">
          Azure Application Insights · LLM Agent Telemetry Dashboard
        </footer>
      </main>
    </TelemetryProvider>
  );
}
