"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import type { GlobalFilters as GlobalFiltersType } from "@/types/telemetry";

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700 border border-surface-600 text-xs text-gray-300 hover:border-azure-500/50 transition-colors"
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-azure-500/20 text-azure-400 text-[10px] font-medium">
            {selected.length}
          </span>
        )}
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && options.length > 0 && (
        <div className="absolute z-50 mt-1 min-w-[180px] bg-surface-800 border border-surface-600 rounded-lg shadow-xl py-1">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-700 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-surface-600 bg-surface-700 text-azure-500 focus:ring-azure-500/30"
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SingleSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700 border border-surface-600 text-xs text-gray-300 hover:border-azure-500/50 transition-colors"
      >
        <span>{label}</span>
        {selected && (
          <span className="px-1.5 py-0.5 rounded bg-azure-500/20 text-azure-400 text-[10px] font-medium truncate max-w-[80px]">
            {selected.replace('STATUS_CODE_', '')}
          </span>
        )}
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && options.length > 0 && (
        <div className="absolute z-50 mt-1 min-w-[180px] bg-surface-800 border border-surface-600 rounded-lg shadow-xl py-1">
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-700 ${!selected ? 'text-azure-400' : 'text-gray-400'}`}
          >
            All
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-700 ${selected === opt ? 'text-azure-400' : 'text-gray-300'}`}
            >
              {opt.replace('STATUS_CODE_', '')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      <MultiSelect label="Model" options={filterOptions.models} selected={filters.models} onChange={v => update({ models: v })} />
      <MultiSelect label="Agent" options={filterOptions.agents} selected={filters.agents} onChange={v => update({ agents: v })} />
      <MultiSelect label="Service" options={filterOptions.services} selected={filters.services} onChange={v => update({ services: v })} />
      <SingleSelect label="Version" options={filterOptions.agentVersions} selected={filters.agentVersion} onChange={v => update({ agentVersion: v })} />
      <SingleSelect label="Status" options={filterOptions.statuses} selected={filters.status} onChange={v => update({ status: v })} />
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
