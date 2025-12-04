export interface ReportMetadata {
  companyName?: string;
  projectName?: string;
  projectAddress?: string;
  preparedBy?: string;
  preparedFor?: string;
  reportDate: string;
  reportId?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}
