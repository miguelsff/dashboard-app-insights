"use client";

import { TelemetryProvider } from "@/context/TelemetryContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <TelemetryProvider>{children}</TelemetryProvider>;
}
