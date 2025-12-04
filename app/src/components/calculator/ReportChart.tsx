import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { ChartDataPoint } from "./print-types";

interface ReportChartProps {
  data: ChartDataPoint[];
}

export function ReportChart({ data }: ReportChartProps) {
  return (
    <div className="my-6 report-chart">
      <h3 className="text-lg font-semibold mb-4 text-center">Load Breakdown Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value.toLocaleString()} BTU/h`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
