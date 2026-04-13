export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#0f1629",
    border: "1px solid #1a2340",
    borderRadius: "8px",
    color: "#f3f4f6",
    fontSize: "12px",
  },
  labelStyle: { color: "#9ca3af" },
} as const;

export const AXIS_TICK = { fill: "#9ca3af", fontSize: 11 } as const;

export const AXIS_BASE = { axisLine: false, tickLine: false } as const;

export const GRID_PROPS = {
  strokeDasharray: "3 3",
  stroke: "#1a2340",
} as const;
