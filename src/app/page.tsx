"use client";

import { TelemetryProvider, useTelemetry } from "@/context/TelemetryContext";
import ResourceInfoCard from "@/components/ResourceInfoCard";
import KpiCards from "@/components/KpiCards";
import OperationsBarChart from "@/components/OperationsBarChart";
import PerformanceBucketChart from "@/components/PerformanceBucketChart";
import SuccessFailurePieChart from "@/components/SuccessFailurePieChart";
import RequestTimeline from "@/components/RequestTimeline";
import ErrorsPanel from "@/components/ErrorsPanel";
import RequestsTable from "@/components/RequestsTable";

function DashboardHeader() {
  const { totalRequests, lastUpdated, fetchError } = useTelemetry();
  const updatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toISOString().slice(11, 19)} UTC`
    : "Static snapshot";

  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Application Insights</h1>
        <p className="text-sm text-gray-400 mt-1">
          credicorp-dispatcher-middleware &middot; GenAI Dispatcher Telemetry
        </p>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`w-2 h-2 rounded-full ${fetchError ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`}
        />
        <span className="text-xs text-gray-500 font-mono">
          {updatedLabel} &middot; {totalRequests} records
        </span>
      </div>
    </header>
  );
}

export default function DashboardPage() {
  return (
    <TelemetryProvider>
      <main className="max-w-screen-2xl mx-auto px-4 py-8 space-y-5">
        <DashboardHeader />

        <ResourceInfoCard />
        <KpiCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <OperationsBarChart />
          </div>
          <SuccessFailurePieChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PerformanceBucketChart />
          <RequestTimeline />
        </div>

        <ErrorsPanel />
        <RequestsTable />

        <footer className="text-center text-xs text-gray-700 py-4">
          Azure Application Insights &middot; app-ins-test-otel-collector &middot; East US
        </footer>
      </main>
    </TelemetryProvider>
  );
}
