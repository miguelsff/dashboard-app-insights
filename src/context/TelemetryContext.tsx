"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange, GlobalFilters, FilterOptions, TelemetryApiResponse, TelemetryRecord } from '@/types/telemetry';
import { computeDerived, extractFilterOptions, applyGlobalFilters } from '@/data/telemetry';

type Derived = ReturnType<typeof computeDerived>;

interface TelemetryContextValue extends Derived {
  lastUpdated: Date | null;
  fetchError: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  truncated: boolean;
  dateRange: DateRange;
  setDateRange: (r: DateRange) => void;
  filters: GlobalFilters;
  setFilters: (f: GlobalFilters) => void;
  filterOptions: FilterOptions;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;

const EMPTY_FILTERS: GlobalFilters = {
  models: [], agents: [], services: [], agentVersion: null, status: null,
};

function defaultRange(): DateRange {
  const end   = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 3600_000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [filters, setFilters] = useState<GlobalFilters>(EMPTY_FILTERS);
  const [rawRecords, setRawRecords] = useState<TelemetryRecord[]>([]);
  const [meta, setMeta] = useState<{
    lastUpdated: Date | null;
    fetchError: boolean;
    errorMessage: string | null;
    isLoading: boolean;
    truncated: boolean;
  }>({
    lastUpdated: null,
    fetchError: false,
    errorMessage: null,
    isLoading: true,
    truncated: false,
  });

  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;

  const fetchData = useCallback(async (cancelled: { value: boolean }) => {
    const { startDate, endDate } = dateRangeRef.current;
    const qs = new URLSearchParams({ startDate, endDate }).toString();
    try {
      const res = await fetch(`/api/telemetry?${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: TelemetryApiResponse = await res.json();
      if (cancelled.value) return;
      setRawRecords(json.records);
      setMeta({
        lastUpdated: new Date(),
        fetchError: false,
        errorMessage: null,
        isLoading: false,
        truncated: json.truncated,
      });
    } catch (err) {
      if (cancelled.value) return;
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setMeta(prev => ({ ...prev, fetchError: true, errorMessage: msg, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const cancelled = { value: false };
    setMeta(prev => ({ ...prev, isLoading: true }));
    fetchData(cancelled);
    const id = setInterval(() => fetchData(cancelled), POLL_INTERVAL_MS);
    return () => {
      cancelled.value = true;
      clearInterval(id);
    };
  }, [dateRange, fetchData]);

  const unfilteredFilterOptions = useMemo(
    () => extractFilterOptions(rawRecords),
    [rawRecords],
  );

  const derived = useMemo(() => {
    const filtered = applyGlobalFilters(rawRecords, filters);
    return computeDerived(filtered);
  }, [rawRecords, filters]);

  const value: TelemetryContextValue = {
    ...derived,
    ...meta,
    dateRange,
    setDateRange,
    filters,
    setFilters,
    filterOptions: unfilteredFilterOptions,
  };

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used inside <TelemetryProvider>');
  return ctx;
}
