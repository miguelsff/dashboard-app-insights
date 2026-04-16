"use client";

import { TelemetryProvider, useTelemetry } from "@/context/TelemetryContext";
import DateRangePicker from "@/components/DateRangePicker";
import GlobalFilters from "@/components/GlobalFilters";
import KpiCards from "@/components/KpiCards";
import LatencyTimeSeriesChart from "@/components/LatencyTimeSeriesChart";
import FinishReasonsChart from "@/components/FinishReasonsChart";
import TokensByDayChart from "@/components/TokensByDayChart";
import CostByModelChart from "@/components/CostByModelChart";
import AgentInvocationsChart from "@/components/AgentInvocationsChart";
import StageDurationChart from "@/components/StageDurationChart";
import LlmVsOrchestrationChart from "@/components/LlmVsOrchestrationChart";
import TraceTable from "@/components/TraceTable";

function DashboardHeader() {
  const { lastUpdated, fetchError, errorMessage, isLoading } = useTelemetry();
  const updatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toISOString().slice(11, 19)} UTC`
    : isLoading ? "Loading…" : "—";

  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Agent Traces — Overview</h1>
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
        <GlobalFilters />
        <KpiCards />

        {/* Row 2: Latency + Finish Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <LatencyTimeSeriesChart />
          </div>
          <FinishReasonsChart />
        </div>

        {/* Row 3: Tokens + Cost */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TokensByDayChart />
          <CostByModelChart />
        </div>

        {/* Row 4: Agents + Stage Duration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AgentInvocationsChart />
          <StageDurationChart />
        </div>

        {/* Row 5: LLM vs Orchestration */}
        <LlmVsOrchestrationChart />

        {/* Trace Table */}
        <TraceTable />

        <footer className="text-center text-xs text-gray-700 py-4">
          Azure Application Insights · Agent Traces Dashboard
        </footer>
      </main>
    </TelemetryProvider>
  );
}
