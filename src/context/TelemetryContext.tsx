"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import type { TelemetryRecord } from '@/types/telemetry';
import { computeDerived } from '@/data/telemetry';

type Derived = ReturnType<typeof computeDerived>;

interface TelemetryContextValue extends Derived {
  lastUpdated: Date | null;
  fetchError: boolean;
  isLoading: boolean;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TelemetryContextValue>({
    ...computeDerived([]),
    lastUpdated: null,
    fetchError: false,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/telemetry');
        if (!res.ok) throw new Error(`${res.status}`);
        const records: TelemetryRecord[] = await res.json();
        setState({ ...computeDerived(records), lastUpdated: new Date(), fetchError: false, isLoading: false });
      } catch {
        setState((prev) => ({ ...prev, fetchError: true, isLoading: false }));
      }
    }

    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return <TelemetryContext.Provider value={state}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used inside <TelemetryProvider>');
  return ctx;
}
