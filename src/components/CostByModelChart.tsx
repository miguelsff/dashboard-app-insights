"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TOOLTIP_STYLE, AXIS_TICK, AXIS_BASE, GRID_PROPS, VISTA1_COLORS } from "@/lib/chart-theme";
import { formatCurrency } from "@/lib/format";

export default function CostByModelChart() {
  const { costByModelData, isLoading } = useTelemetry();

  if (isLoading) {
    return <div className="card"><div className="skeleton h-64 rounded-lg" /></div>;
  }

  if (costByModelData.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Costo Estimado por Modelo</h3>
        <p className="text-sm text-gray-500">No data in this period</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title">Costo Estimado por Modelo</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={costByModelData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="model" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} tickFormatter={(v: number) => formatCurrency(v)} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
          <Bar dataKey="costInput" name="Costo Input" stackId="cost" fill={VISTA1_COLORS.inputTokens} radius={[0, 0, 0, 0]} />
          <Bar dataKey="costOutput" name="Costo Output" stackId="cost" fill={VISTA1_COLORS.outputTokens} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
