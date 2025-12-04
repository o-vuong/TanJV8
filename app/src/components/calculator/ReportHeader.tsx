import type { ReportMetadata } from "./print-types";

interface ReportHeaderProps {
  metadata: ReportMetadata;
}

export function ReportHeader({ metadata }: ReportHeaderProps) {
  return (
    <div className="mb-8 pb-6 border-b-2 border-gray-300 print:border-black">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manual J Load Calculation Report</h1>
          {metadata.companyName && (
            <p className="text-lg font-semibold">{metadata.companyName}</p>
          )}
          {metadata.preparedBy && (
            <p className="text-sm text-gray-700">Prepared by: {metadata.preparedBy}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">Report Date: {metadata.reportDate}</p>
          {metadata.reportId && (
            <p className="text-sm">Report ID: {metadata.reportId}</p>
          )}
        </div>
      </div>
      {(metadata.projectName || metadata.projectAddress || metadata.preparedFor) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {metadata.projectName && (
            <p className="font-semibold">Project: {metadata.projectName}</p>
          )}
          {metadata.projectAddress && (
            <p className="text-sm">Address: {metadata.projectAddress}</p>
          )}
          {metadata.preparedFor && (
            <p className="text-sm">Prepared for: {metadata.preparedFor}</p>
          )}
        </div>
      )}
    </div>
  );
}
