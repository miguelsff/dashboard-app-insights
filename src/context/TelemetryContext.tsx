"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import type { TelemetryRecord } from '@/types/telemetry';
import { computeDerived } from '@/data/telemetry';

type Derived = ReturnType<typeof computeDerived>;

interface TelemetryContextValue extends Derived {
  lastUpdated: Date | null;
  fetchError: boolean;
  errorMessage: string | null;
  isLoading: boolean;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TelemetryContextValue>({
    ...computeDerived([]),
    lastUpdated: null,
    fetchError: false,
    errorMessage: null,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/telemetry');
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const records: TelemetryRecord[] = await res.json();
        setState({ ...computeDerived(records), lastUpdated: new Date(), fetchError: false, errorMessage: null, isLoading: false });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setState((prev) => ({ ...prev, fetchError: true, errorMessage: msg, isLoading: false }));
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
