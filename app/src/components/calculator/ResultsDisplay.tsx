import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Gauge, LineChart, FileText, Thermometer, Save, Plus } from "lucide-react";
import { useState } from "react";
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
import { useCreateCalculation } from "../../lib/queries/calculations";
import { useGroups, useCreateGroup, useCreateProject, type Group, type Project } from "../../lib/queries/groups";
import { useSession } from "../../lib/auth/client";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

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
	const { data: session } = useSession();
	const { data: groups } = useGroups();
	const createCalculation = useCreateCalculation();
	const createGroup = useCreateGroup();
	const createProject = useCreateProject();

	const [showSaveModal, setShowSaveModal] = useState(false);
	const [selectedGroupId, setSelectedGroupId] = useState<string>("");
	const [selectedProjectId, setSelectedProjectId] = useState<string>("");
	const [showCreateGroup, setShowCreateGroup] = useState(false);
	const [showCreateProject, setShowCreateProject] = useState(false);
	const [groupName, setGroupName] = useState("");
	const [projectName, setProjectName] = useState("");
	const [projectDescription, setProjectDescription] = useState("");

	const selectedGroup = groups?.find((g) => g.id === selectedGroupId);
	const availableProjects = selectedGroup?.projects || [];

	const handleSave = async () => {
		if (!selectedProjectId) return;

		try {
			await createCalculation.mutateAsync({
				projectId: selectedProjectId,
				inputs: inputs as unknown as Record<string, unknown>,
				results: results as unknown as Record<string, unknown>,
			});
			setShowSaveModal(false);
			setSelectedProjectId("");
			setSelectedGroupId("");
		} catch (error) {
			console.error("Failed to save calculation:", error);
		}
	};

	const handleCreateGroup = async () => {
		if (!groupName.trim()) return;
		try {
			const newGroup = await createGroup.mutateAsync({ name: groupName });
			setGroupName("");
			setShowCreateGroup(false);
			setSelectedGroupId(newGroup.id);
		} catch (error) {
			console.error("Failed to create group:", error);
		}
	};

	const handleCreateProject = async () => {
		if (!projectName.trim() || !selectedGroupId) return;
		try {
			const newProject = await createProject.mutateAsync({
				name: projectName,
				description: projectDescription || undefined,
				groupId: selectedGroupId,
			});
			setProjectName("");
			setProjectDescription("");
			setShowCreateProject(false);
			setSelectedProjectId(newProject.id);
		} catch (error) {
			console.error("Failed to create project:", error);
		}
	};

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
				<div className="flex gap-3">
					{session?.user && (
						<Button
							onClick={() => setShowSaveModal(true)}
							className="px-6 bg-green-600 hover:bg-green-700"
						>
							<Save className="w-4 h-4 mr-2" />
							Save Calculation
						</Button>
					)}
					<Button
						onClick={onStartNew}
						className="px-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
					>
						Start new calculation
					</Button>
				</div>
			</div>

			{/* Save Calculation Modal */}
			{showSaveModal && session?.user && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
						<h3 className="text-xl font-semibold text-white mb-4">
							Save Calculation
						</h3>

						{!showCreateGroup && !showCreateProject && (
							<div className="space-y-4">
								<div>
									<Label htmlFor="group-select" className="text-gray-300">
										Group
									</Label>
									<div className="flex gap-2 mt-1">
										<Select
											value={selectedGroupId}
											onValueChange={setSelectedGroupId}
										>
											<SelectTrigger className="flex-1 bg-slate-900 border-slate-600 text-white">
												<SelectValue placeholder="Select a group" />
											</SelectTrigger>
											<SelectContent>
												{groups?.map((group) => (
													<SelectItem key={group.id} value={group.id}>
														{group.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											variant="outline"
											onClick={() => setShowCreateGroup(true)}
											className="border-slate-600 text-gray-300"
										>
											<Plus className="w-4 h-4" />
										</Button>
									</div>
								</div>

								{selectedGroupId && (
									<div>
										<Label htmlFor="project-select" className="text-gray-300">
											Project
										</Label>
										<div className="flex gap-2 mt-1">
											<Select
												value={selectedProjectId}
												onValueChange={setSelectedProjectId}
											>
												<SelectTrigger className="flex-1 bg-slate-900 border-slate-600 text-white">
													<SelectValue placeholder="Select a project" />
												</SelectTrigger>
												<SelectContent>
													{availableProjects.map((project) => (
														<SelectItem key={project.id} value={project.id}>
															{project.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Button
												variant="outline"
												onClick={() => setShowCreateProject(true)}
												className="border-slate-600 text-gray-300"
											>
												<Plus className="w-4 h-4" />
											</Button>
										</div>
									</div>
								)}

								<div className="flex gap-2 justify-end pt-4">
									<Button
										variant="outline"
										onClick={() => {
											setShowSaveModal(false);
											setSelectedProjectId("");
											setSelectedGroupId("");
										}}
										className="border-slate-600 text-gray-300"
									>
										Cancel
									</Button>
									<Button
										onClick={handleSave}
										disabled={!selectedProjectId || createCalculation.isPending}
										className="bg-green-600 hover:bg-green-700"
									>
										{createCalculation.isPending ? "Saving..." : "Save"}
									</Button>
								</div>
							</div>
						)}

						{/* Create Group Form */}
						{showCreateGroup && (
							<div className="space-y-4">
								<h4 className="text-lg font-semibold text-white">Create New Group</h4>
								<div>
									<Label htmlFor="new-group-name" className="text-gray-300">
										Group Name
									</Label>
									<Input
										id="new-group-name"
										value={groupName}
										onChange={(e) => setGroupName(e.target.value)}
										className="mt-1 bg-slate-900 border-slate-600 text-white"
										placeholder="e.g., Residential Projects"
									/>
								</div>
								<div className="flex gap-2 justify-end">
									<Button
										variant="outline"
										onClick={() => {
											setShowCreateGroup(false);
											setGroupName("");
										}}
										className="border-slate-600 text-gray-300"
									>
										Cancel
									</Button>
									<Button
										onClick={handleCreateGroup}
										disabled={!groupName.trim() || createGroup.isPending}
										className="bg-blue-600 hover:bg-blue-700"
									>
										{createGroup.isPending ? "Creating..." : "Create"}
									</Button>
								</div>
							</div>
						)}

						{/* Create Project Form */}
						{showCreateProject && (
							<div className="space-y-4">
								<h4 className="text-lg font-semibold text-white">Create New Project</h4>
								<div>
									<Label htmlFor="new-project-name" className="text-gray-300">
										Project Name
									</Label>
									<Input
										id="new-project-name"
										value={projectName}
										onChange={(e) => setProjectName(e.target.value)}
										className="mt-1 bg-slate-900 border-slate-600 text-white"
										placeholder="e.g., 123 Main St"
									/>
								</div>
								<div>
									<Label htmlFor="new-project-desc" className="text-gray-300">
										Description (optional)
									</Label>
									<Input
										id="new-project-desc"
										value={projectDescription}
										onChange={(e) => setProjectDescription(e.target.value)}
										className="mt-1 bg-slate-900 border-slate-600 text-white"
										placeholder="Additional details..."
									/>
								</div>
								<div className="flex gap-2 justify-end">
									<Button
										variant="outline"
										onClick={() => {
											setShowCreateProject(false);
											setProjectName("");
											setProjectDescription("");
										}}
										className="border-slate-600 text-gray-300"
									>
										Cancel
									</Button>
									<Button
										onClick={handleCreateProject}
										disabled={!projectName.trim() || createProject.isPending}
										className="bg-blue-600 hover:bg-blue-700"
									>
										{createProject.isPending ? "Creating..." : "Create"}
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
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
