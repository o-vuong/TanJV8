import type { ManualJResults } from "@manualj/calc-engine";
import type { ChartDataPoint } from "./print-types";

export function transformBreakdownToChartData(results: ManualJResults): ChartDataPoint[] {
  const { breakdown } = results;
  const total = results.total;

  const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF', '#1E40AF'];

  return [
    { name: "Wall Conduction", value: breakdown.conduction.walls, percentage: (breakdown.conduction.walls / total) * 100, fill: colors[0] },
    { name: "Roof Conduction", value: breakdown.conduction.roof, percentage: (breakdown.conduction.roof / total) * 100, fill: colors[1] },
    { name: "Window Conduction", value: breakdown.conduction.windows, percentage: (breakdown.conduction.windows / total) * 100, fill: colors[2] },
    { name: "Solar Gain", value: breakdown.solar, percentage: (breakdown.solar / total) * 100, fill: colors[3] },
    { name: "Infiltration", value: breakdown.infiltration, percentage: (breakdown.infiltration / total) * 100, fill: colors[4] },
    { name: "Internal Gains", value: breakdown.internalGains, percentage: (breakdown.internalGains / total) * 100, fill: colors[5] },
    { name: "Duct Losses", value: breakdown.ductLosses, percentage: (breakdown.ductLosses / total) * 100, fill: colors[6] },
  ];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
