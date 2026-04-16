"use client";

import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, ResponsiveContainer,
} from "recharts";
import { useTelemetry } from "@/context/TelemetryContext";
import { AXIS_BASE, AXIS_TICK, GRID_PROPS, TOOLTIP_STYLE, CHART_MARGIN_COMPACT, LEGEND_STYLE } from "@/lib/chart-theme";
import ChartCard from "@/components/ui/ChartCard";

function formatHourLabel(hour: string) {
  return hour.slice(11, 13) + ":00";
}

export default function TraceTimelineChart() {
  const { traceTimelineData, isLoading } = useTelemetry();

  const data = traceTimelineData.map((d) => ({
    ...d,
    label: formatHourLabel(d.hour),
    successful: d.count - d.failures,
  }));

  return (
    <ChartCard
      title="Trace Volume"
      fullTitle="Trace Volume (hourly)"
      isLoading={isLoading}
      isEmpty={traceTimelineData.length === 0}
      emptyMessage="No traces in this period."
      skeletonHeight="h-48"
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={CHART_MARGIN_COMPACT}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" tick={AXIS_TICK} {...AXIS_BASE} />
          <YAxis tick={AXIS_TICK} {...AXIS_BASE} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [value, name === 'successful' ? 'Successful' : name === 'failures' ? 'Failed' : name]}
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
          <Area type="monotone" dataKey="successful" name="Successful" stackId="1"
            stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
          <Area type="monotone" dataKey="failures" name="Failed" stackId="1"
            stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
