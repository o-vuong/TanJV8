import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import { ReportHeader } from "./ReportHeader";
import { ReportChart } from "./ReportChart";
import type { ReportMetadata } from "./print-types";
import { transformBreakdownToChartData } from "./print-utils";

interface PrintableReportProps {
  inputs: ManualJInputs;
  results: ManualJResults;
  metadata: ReportMetadata;
}

export const PrintableReport = ({ inputs, results, metadata }: PrintableReportProps) => {
  const chartData = transformBreakdownToChartData(results);

  return (
    <div className="print-only hidden print:block bg-white text-black p-8 max-w-4xl mx-auto">
      <ReportHeader metadata={metadata} />

      {/* Summary Section */}
      <section className="mb-6 page-break-avoid">
        <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-300">Summary</h2>
        <table className="w-full">
          <tbody>
            <tr><td className="font-semibold py-2">Sensible Load:</td><td>{results.sensible.toLocaleString()} BTU/h</td></tr>
            <tr><td className="font-semibold py-2">Latent Load:</td><td>{results.latent.toLocaleString()} BTU/h</td></tr>
            <tr className="font-bold border-t-2 border-gray-300"><td className="py-2">Total Cooling Load:</td><td>{results.total.toLocaleString()} BTU/h</td></tr>
            <tr><td className="font-semibold py-2">System Size:</td><td>{results.tonnage} tons</td></tr>
            <tr><td className="font-semibold py-2">Required Airflow:</td><td>{results.cfm} CFM</td></tr>
          </tbody>
        </table>
      </section>

      {/* Chart Section */}
      <section className="mb-6 page-break-avoid">
        <ReportChart data={chartData} />
      </section>

      {/* Load Breakdown Table */}
      <section className="mb-6 page-break-avoid">
        <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-300">Detailed Load Breakdown</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Component</th>
              <th className="text-right p-2">BTU/h</th>
              <th className="text-right p-2">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item) => (
              <tr key={item.name}>
                <td className="p-2">{item.name}</td>
                <td className="text-right p-2">{item.value.toLocaleString()}</td>
                <td className="text-right p-2">{item.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Input Snapshot */}
      <section className="page-break-before">
        <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-300">Input Parameters</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div><span className="font-semibold">Floor Area:</span> {inputs.area} sq ft</div>
          <div><span className="font-semibold">Indoor Temperature:</span> {inputs.climate.indoorTemp}°F</div>
          <div><span className="font-semibold">Wall Area:</span> {inputs.envelope.wallArea} sq ft</div>
          <div><span className="font-semibold">Wall R-value:</span> R-{inputs.envelope.wallR}</div>
          <div><span className="font-semibold">Roof Area:</span> {inputs.envelope.roofArea} sq ft</div>
          <div><span className="font-semibold">Roof R-value:</span> R-{inputs.envelope.roofR}</div>
          <div><span className="font-semibold">Window Area:</span> {inputs.envelope.windowArea} sq ft</div>
          <div><span className="font-semibold">Window U-value:</span> {inputs.envelope.windowU}</div>
          <div><span className="font-semibold">Window SHGC:</span> {inputs.envelope.windowSHGC}</div>
          <div><span className="font-semibold">Infiltration Class:</span> {inputs.infiltration.class}</div>
          <div><span className="font-semibold">Occupants:</span> {inputs.internal.occupants}</div>
          <div><span className="font-semibold">Lighting:</span> {inputs.internal.lighting}W</div>
          <div><span className="font-semibold">Appliances:</span> {inputs.internal.appliances}W</div>
          <div><span className="font-semibold">Duct Location:</span> {inputs.ducts.location}</div>
          <div><span className="font-semibold">Duct Efficiency:</span> {(inputs.ducts.efficiency * 100).toFixed(0)}%</div>
        </div>
      </section>
    </div>
  );
};
