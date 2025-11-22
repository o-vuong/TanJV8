import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Gauge, LineChart, FileText, Thermometer } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";

interface ResultsDisplayProps {
	inputs: ManualJInputs;
	results: ManualJResults;
	onBack: () => void;
	onStartNew: () => void;
}

type BreakdownRow = {
	component: string;
	btuPerHour: number;
	percentage: number;
};

const columnHelper = createColumnHelper<BreakdownRow>();

const columns = [
	columnHelper.accessor("component", {
		header: "Component",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("btuPerHour", {
		header: "BTU/h",
		cell: (info) => info.getValue().toLocaleString(),
	}),
	columnHelper.accessor("percentage", {
		header: "% of total",
		cell: (info) => `${info.getValue().toFixed(1)}%`,
	}),
];

export function ResultsDisplay({
	inputs,
	results,
	onBack,
	onStartNew,
}: ResultsDisplayProps) {
	const breakdownData: BreakdownRow[] = [
		{
			component: "Wall conduction",
			btuPerHour: results.breakdown.conduction.walls,
			percentage: (results.breakdown.conduction.walls / results.total) * 100,
		},
		{
			component: "Roof conduction",
			btuPerHour: results.breakdown.conduction.roof,
			percentage: (results.breakdown.conduction.roof / results.total) * 100,
		},
		{
			component: "Window conduction",
			btuPerHour: results.breakdown.conduction.windows,
			percentage: (results.breakdown.conduction.windows / results.total) * 100,
		},
		{
			component: "Solar gain",
			btuPerHour: results.breakdown.solar,
			percentage: (results.breakdown.solar / results.total) * 100,
		},
		{
			component: "Infiltration",
			btuPerHour: results.breakdown.infiltration,
			percentage: (results.breakdown.infiltration / results.total) * 100,
		},
		{
			component: "Internal gains",
			btuPerHour: results.breakdown.internalGains,
			percentage: (results.breakdown.internalGains / results.total) * 100,
		},
		{
			component: "Duct losses",
			btuPerHour: results.breakdown.ductLosses,
			percentage: (results.breakdown.ductLosses / results.total) * 100,
		},
	];

	const table = useReactTable({
		data: breakdownData,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const totalConduction =
		results.breakdown.conduction.walls +
		results.breakdown.conduction.roof +
		results.breakdown.conduction.windows;

	return (
		<div className="space-y-6">
			<Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
				<CardHeader className="border-b border-slate-700 bg-slate-900/50">
					<CardTitle className="text-2xl flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
							<Gauge className="w-6 h-6 text-white" />
						</div>
						Summary
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6">
					<SummaryItem
						label="Sensible load"
						value={`${results.sensible.toLocaleString()} BTU/h`}
					/>
					<SummaryItem
						label="Latent load"
						value={`${results.latent.toLocaleString()} BTU/h`}
					/>
					<SummaryItem
						label="Total cooling load"
						value={`${results.total.toLocaleString()} BTU/h`}
					/>
					<SummaryItem
						label="System size"
						value={`${results.tonnage.toFixed(1)} tons`}
					/>
					<SummaryItem label="Required airflow" value={`${results.cfm} CFM`} />
					<SummaryItem
						label="Total conduction"
						value={`${totalConduction.toLocaleString()} BTU/h`}
					/>
				</CardContent>
			</Card>

			<Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
				<CardHeader className="border-b border-slate-700 bg-slate-900/50">
					<CardTitle className="text-2xl flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
							<LineChart className="w-6 h-6 text-white" />
						</div>
						Load breakdown
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
				<CardHeader className="border-b border-slate-700 bg-slate-900/50">
					<CardTitle className="text-2xl flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
							<FileText className="w-6 h-6 text-white" />
						</div>
						Input snapshot
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-6">
					<SummaryItem label="Floor area" value={`${inputs.area} sq ft`} />
					<SummaryItem
						label="Wall area"
						value={`${inputs.envelope.wallArea} sq ft`}
					/>
					<SummaryItem label="Wall R-value" value={`R-${inputs.envelope.wallR}`} />
					<SummaryItem
						label="Roof area"
						value={`${inputs.envelope.roofArea} sq ft`}
					/>
					<SummaryItem label="Roof R-value" value={`R-${inputs.envelope.roofR}`} />
					<SummaryItem
						label="Window area"
						value={`${inputs.envelope.windowArea} sq ft`}
					/>
					<SummaryItem
						label="Window U-factor"
						value={`${inputs.envelope.windowU}`}
					/>
					<SummaryItem
						label="Window SHGC"
						value={`${inputs.envelope.windowSHGC}`}
					/>
					<SummaryItem
						label="Infiltration class"
						value={inputs.infiltration.class}
					/>
					<SummaryItem label="Occupants" value={`${inputs.internal.occupants}`} />
					<SummaryItem
						label="Lighting"
						value={`${inputs.internal.lighting} W`}
					/>
					<SummaryItem
						label="Appliances"
						value={`${inputs.internal.appliances} W`}
					/>
					<SummaryItem label="Duct location" value={inputs.ducts.location} />
					<SummaryItem
						label="Duct efficiency"
						value={`${(inputs.ducts.efficiency * 100).toFixed(0)}%`}
					/>
					<SummaryItem
						label="Indoor temp"
						value={`${inputs.climate.indoorTemp} °F`}
					/>
					<SummaryItem
						label="Summer design temp"
						value={`${inputs.climate.summerDesignTemp} °F`}
					/>
				</CardContent>
			</Card>

			<div className="flex justify-between gap-3">
				<Button 
					variant="outline" 
					onClick={onBack}
					className="px-6 border-slate-700 hover:bg-slate-800"
				>
					← Back
				</Button>
				<Button 
					onClick={onStartNew}
					className="px-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
				>
					Start new calculation
				</Button>
			</div>
		</div>
	);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-2 rounded-lg border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5 hover:border-blue-500/50 transition-all">
			<p className="text-xs uppercase tracking-wide text-gray-500">
				{label}
			</p>
			<p className="text-2xl font-bold text-white">{value}</p>
		</div>
	);
}
