"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { DateRange, TelemetryApiResponse } from '@/types/telemetry';
import { computeDerived } from '@/data/telemetry';

type Derived = ReturnType<typeof computeDerived>;

interface TelemetryContextValue extends Derived {
  lastUpdated: Date | null;
  fetchError: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  truncated: boolean;
  dateRange: DateRange;
  setDateRange: (r: DateRange) => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;

function defaultRange(): DateRange {
  const end   = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 3600_000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);

  const [state, setState] = useState<Omit<TelemetryContextValue, 'dateRange' | 'setDateRange'>>({
    ...computeDerived([]),
    lastUpdated: null,
    fetchError: false,
    errorMessage: null,
    isLoading: true,
    truncated: false,
  });

  // Keep a ref so the interval callback always sees the latest dateRange
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
      setState({
        ...computeDerived(json.records),
        truncated: json.truncated,
        lastUpdated: new Date(),
        fetchError: false,
        errorMessage: null,
        isLoading: false,
      });
    } catch (err) {
      if (cancelled.value) return;
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setState((prev) => ({ ...prev, fetchError: true, errorMessage: msg, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const cancelled = { value: false };
    setState((prev) => ({ ...prev, isLoading: true }));
    fetchData(cancelled);
    const id = setInterval(() => fetchData(cancelled), POLL_INTERVAL_MS);
    return () => {
      cancelled.value = true;
      clearInterval(id);
    };
  }, [dateRange, fetchData]);

  const value: TelemetryContextValue = {
    ...state,
    dateRange,
    setDateRange,
  };

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used inside <TelemetryProvider>');
  return ctx;
}
