"use client";

import { useCallback } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import type { GlobalFilters as GlobalFiltersType } from "@/types/telemetry";
import Dropdown from "@/components/ui/Dropdown";

const formatStatus = (v: string) => v.replace("STATUS_CODE_", "");

export default function GlobalFilters() {
  const { filterOptions, filters, setFilters } = useTelemetry();

  const update = useCallback(
    (patch: Partial<GlobalFiltersType>) => setFilters({ ...filters, ...patch }),
    [filters, setFilters],
  );

  const hasActive =
    filters.models.length > 0 ||
    filters.agents.length > 0 ||
    filters.services.length > 0 ||
    filters.agentVersion !== null ||
    filters.status !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 font-medium mr-1">Filters</span>
      <Dropdown mode="multi" label="Model" options={filterOptions.models} selected={filters.models} onChange={v => update({ models: v })} />
      <Dropdown mode="multi" label="Agent" options={filterOptions.agents} selected={filters.agents} onChange={v => update({ agents: v })} />
      <Dropdown mode="multi" label="Service" options={filterOptions.services} selected={filters.services} onChange={v => update({ services: v })} />
      <Dropdown mode="single" label="Version" options={filterOptions.agentVersions} selected={filters.agentVersion} onChange={v => update({ agentVersion: v })} />
      <Dropdown mode="single" label="Status" options={filterOptions.statuses} selected={filters.status} onChange={v => update({ status: v })} formatLabel={formatStatus} />
      {hasActive && (
        <button
          onClick={() => setFilters({ models: [], agents: [], services: [], agentVersion: null, status: null })}
          className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
