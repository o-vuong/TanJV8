import type { BuildingInputs, CalculationResults } from "@manualj/calc-engine";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
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
	inputs: BuildingInputs;
	results: CalculationResults;
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
			btuPerHour: results.coolingLoad.breakdown.conduction,
			percentage:
				(results.coolingLoad.breakdown.conduction / results.coolingLoad.total) *
				100,
		},
		{
			component: "Solar gain",
			btuPerHour: results.coolingLoad.breakdown.solar,
			percentage:
				(results.coolingLoad.breakdown.solar / results.coolingLoad.total) * 100,
		},
		{
			component: "Infiltration",
			btuPerHour: results.coolingLoad.breakdown.infiltration,
			percentage:
				(results.coolingLoad.breakdown.infiltration /
					results.coolingLoad.total) *
				100,
		},
		{
			component: "Internal gains",
			btuPerHour: results.coolingLoad.breakdown.internalGains,
			percentage:
				(results.coolingLoad.breakdown.internalGains /
					results.coolingLoad.total) *
				100,
		},
		{
			component: "Duct losses",
			btuPerHour: results.coolingLoad.breakdown.ductLosses,
			percentage:
				(results.coolingLoad.breakdown.ductLosses / results.coolingLoad.total) *
				100,
		},
	];

	const table = useReactTable({
		data: breakdownData,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Summary</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<SummaryItem
						label="Total cooling load"
						value={`${results.coolingLoad.total.toLocaleString()} BTU/h`}
					/>
					<SummaryItem
						label="Total heating load"
						value={`${results.heatingLoad.total.toLocaleString()} BTU/h`}
					/>
					<SummaryItem
						label="System size"
						value={`${results.equipmentSizing.cooling.tonnage.toFixed(1)} tons`}
					/>
					<SummaryItem
						label="Required airflow"
						value={`${results.equipmentSizing.airflow.cfm} CFM`}
					/>
					<SummaryItem
						label="Sensible Heat Ratio"
						value={`${results.summary.efficiencyMetrics.sensibleHeatRatio}`}
					/>
					<SummaryItem
						label="Latent fraction"
						value={`${results.summary.efficiencyMetrics.latentFraction}`}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Cooling load breakdown</CardTitle>
				</CardHeader>
				<CardContent>
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

			<Card>
				<CardHeader>
					<CardTitle>Input snapshot</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<SummaryItem label="Climate zone" value={inputs.climateZone} />
					<SummaryItem
						label="Design ΔT"
						value={`${inputs.designTemperatureDifference.toFixed(1)} °F`}
					/>
					<SummaryItem
						label="Building volume"
						value={`${inputs.buildingVolume.toLocaleString()} ft³`}
					/>
					<SummaryItem
						label="Infiltration class"
						value={inputs.infiltrationClass}
					/>
					<SummaryItem label="Duct location" value={inputs.ductwork.location} />
					<SummaryItem
						label="Duct insulation"
						value={inputs.ductwork.insulation}
					/>
				</CardContent>
			</Card>

			<div className="flex justify-end gap-3">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button onClick={onStartNew}>Start new calculation</Button>
			</div>
		</div>
	);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1 rounded-lg border bg-muted/40 p-4">
			<p className="text-xs uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<p className="text-lg font-semibold">{value}</p>
		</div>
	);
}
