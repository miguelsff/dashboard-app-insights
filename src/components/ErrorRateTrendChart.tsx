"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { AXIS_BASE, AXIS_TICK, GRID_PROPS, TOOLTIP_STYLE, CHART_MARGIN_COMPACT } from "@/lib/chart-theme";
import ChartCard from "@/components/ui/ChartCard";

function formatHourLabel(hour: string) {
  return hour.slice(11, 13) + ":00";
}

export default function ErrorRateTrendChart() {
  const { errorRateTrendData, isLoading } = useTelemetry();

  const data = errorRateTrendData.map((d) => ({
    label: formatHourLabel(d.hour),
    errorRate: d.errorRate,
  }));

  return (
    <ChartCard
      title="Error Rate Trend"
      fullTitle="Error Rate Trend (hourly %)"
      isLoading={isLoading}
      isEmpty={errorRateTrendData.length === 0}
      emptyMessage="No data in this period."
      skeletonHeight="h-48"
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={CHART_MARGIN_COMPACT}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} unit="%" domain={[0, 'auto']} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v) => [`${v}%`, 'Error Rate']}
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="errorRate"
            name="Error Rate"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ef4444' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
