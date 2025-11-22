import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import {
	Home,
	Square,
	Wind,
	Users,
	Lightbulb,
	Gauge,
	Thermometer,
} from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { z } from "zod";
import type { ClimateData } from "../../lib/queries/location";
import { getManualJWorker } from "../../lib/workers/manualj-client";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

const schema = z.object({
	area: z.coerce.number().positive("Area must be positive"),
	ceilingHeight: z.coerce.number().positive("Ceiling height must be positive"),
	wallArea: z.coerce.number().nonnegative("Wall area must be non-negative"),
	wallR: z.coerce.number().positive("Wall R-value must be positive"),
	roofArea: z.coerce.number().positive("Roof area must be positive"),
	roofR: z.coerce.number().positive("Roof R-value must be positive"),
	windowArea: z.coerce.number().nonnegative("Window area must be non-negative"),
	windowU: z.coerce
		.number()
		.positive("Window U-value must be positive")
		.max(2, "Window U-value seems too high"),
	windowSHGC: z.coerce
		.number()
		.min(0, "SHGC must be between 0 and 1")
		.max(1, "SHGC must be between 0 and 1"),
	infiltrationClass: z.enum(["tight", "average", "loose"]),
	occupants: z.coerce.number().int().nonnegative("Occupants must be non-negative"),
	lighting: z.coerce.number().nonnegative("Lighting watts must be non-negative"),
	appliances: z.coerce.number().nonnegative("Appliance watts must be non-negative"),
	ductLocation: z.enum(["conditioned", "unconditioned"]),
	ductEfficiency: z.coerce
		.number()
		.min(0, "Efficiency must be between 0 and 1")
		.max(1, "Efficiency must be between 0 and 1"),
	indoorTemp: z.coerce.number().positive("Indoor temperature must be positive"),
});

type FormValues = z.infer<typeof schema>;

const fieldValidators = schema.shape as Record<keyof FormValues, z.ZodTypeAny>;

interface InputWizardProps {
	climateData: ClimateData;
	onComplete: (inputs: ManualJInputs, results: ManualJResults) => void;
	onBack: () => void;
}

export function InputWizard({
	climateData,
	onComplete,
	onBack,
}: InputWizardProps) {
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [isCalculating, setIsCalculating] = useState(false);

	const form = useForm<FormValues>({
		defaultValues: {
			area: 2400,
			ceilingHeight: 8,
			wallArea: 700,
			wallR: 13,
			roofArea: 2400,
			roofR: 38,
			windowArea: 140,
			windowU: 0.35,
			windowSHGC: 0.35,
			infiltrationClass: "average",
			occupants: 4,
			lighting: 2000,
			appliances: 1600,
			ductLocation: "unconditioned",
			ductEfficiency: 0.85,
			indoorTemp: 75,
		},
		validatorAdapter: zodValidator,
		onSubmit: async ({ value }) => {
			setIsCalculating(true);
			setProgress(0);
			setError(null);

			try {
				const volume = value.area * value.ceilingHeight;

				const inputs: ManualJInputs = {
					area: value.area,
					climateRefId: climateData.climateRefId,
					envelope: {
						wallArea: value.wallArea,
						wallR: value.wallR,
						roofArea: value.roofArea,
						roofR: value.roofR,
						windowArea: value.windowArea,
						windowU: value.windowU,
						windowSHGC: value.windowSHGC,
					},
					infiltration: {
						class: value.infiltrationClass,
						volume,
					},
					internal: {
						occupants: value.occupants,
						lighting: value.lighting,
						appliances: value.appliances,
					},
					ducts: {
						location: value.ductLocation,
						efficiency: value.ductEfficiency,
					},
					climate: {
						summerDesignTemp: climateData.variables.summerDesignTemp,
						winterDesignTemp: climateData.variables.winterDesignTemp,
						indoorTemp: value.indoorTemp,
					},
				};

				const worker = getManualJWorker();
				const results = await worker.calculate(inputs, {
					onProgress: (p) => setProgress(p),
				});

				onComplete(inputs, results);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Calculation failed");
			} finally {
				setIsCalculating(false);
				setProgress(null);
			}
		},
	});

	const renderNumberField = (
		name: keyof FormValues,
		label: string,
		props?: InputHTMLAttributes<HTMLInputElement>,
	) => (
		<form.Field name={name} validators={{ onChange: fieldValidators[name] }}>
			{(field) => (
				<div className="space-y-2">
					<Label htmlFor={String(name)}>{label}</Label>
					<Input
						id={String(name)}
						type="number"
						value={field.state.value}
						onChange={(event) => field.handleChange(Number(event.target.value))}
						onBlur={field.handleBlur}
						{...props}
					/>
					{field.state.meta.errors?.[0] && (
						<p className="text-sm text-destructive">
							{field.state.meta.errors[0]}
						</p>
					)}
				</div>
			)}
		</form.Field>
	);

	return (
		<Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
			<CardHeader className="border-b border-slate-700 bg-slate-900/50">
				<CardTitle className="text-2xl flex items-center gap-3">
					<div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
						<Home className="w-6 h-6 text-white" />
					</div>
					Step 2: Building inputs
				</CardTitle>
			</CardHeader>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
				autoComplete="off"
			>
				<CardContent className="space-y-8 p-6">
					<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
						<div className="flex items-center gap-2 text-white font-semibold">
							<Home className="w-5 h-5 text-blue-400" />
							<h3>Building dimensions</h3>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							{renderNumberField("area", "Floor area (sq ft)", { min: 1 })}
							{renderNumberField("ceilingHeight", "Ceiling height (ft)", {
								min: 1,
							})}
						</div>
					</section>

					<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
						<div className="flex items-center gap-2 text-white font-semibold">
							<Square className="w-5 h-5 text-blue-400" />
							<h3>Building envelope</h3>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							{renderNumberField("wallArea", "Total wall area (sq ft)", {
								min: 0,
							})}
							{renderNumberField("wallR", "Wall R-value", {
								min: 1,
								step: 0.1,
							})}
							{renderNumberField("roofArea", "Roof area (sq ft)", { min: 0 })}
							{renderNumberField("roofR", "Roof R-value", {
								min: 1,
								step: 0.1,
							})}
							{renderNumberField("windowArea", "Total window area (sq ft)", {
								min: 0,
							})}
							{renderNumberField("windowU", "Window U-factor", {
								step: 0.01,
								min: 0.01,
								max: 2,
							})}
							{renderNumberField("windowSHGC", "Window SHGC", {
								step: 0.05,
								min: 0,
								max: 1,
							})}
						</div>
					</section>

					<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
						<div className="flex items-center gap-2 text-white font-semibold">
							<Wind className="w-5 h-5 text-blue-400" />
							<h3>Infiltration</h3>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field
								name="infiltrationClass"
								validators={{ onChange: fieldValidators.infiltrationClass }}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor="infiltrationClass">Infiltration class</Label>
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(
													value as FormValues["infiltrationClass"],
												)
											}
										>
											<SelectTrigger id="infiltrationClass">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="tight">Tight</SelectItem>
												<SelectItem value="average">Average</SelectItem>
												<SelectItem value="loose">Loose</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
						</div>
					</section>

					<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
						<div className="flex items-center gap-2 text-white font-semibold">
							<Users className="w-5 h-5 text-blue-400" />
							<h3>Internal gains</h3>
						</div>
						<div className="grid gap-4 sm:grid-cols-3">
							{renderNumberField("occupants", "Occupants", { min: 0, step: 1 })}
							{renderNumberField("lighting", "Lighting (watts)", {
								min: 0,
								step: 10,
							})}
							{renderNumberField("appliances", "Appliances (watts)", {
								min: 0,
								step: 10,
							})}
						</div>
					</section>

					<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
						<div className="flex items-center gap-2 text-white font-semibold">
							<Gauge className="w-5 h-5 text-blue-400" />
							<h3>Duct system</h3>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field
								name="ductLocation"
								validators={{ onChange: fieldValidators.ductLocation }}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor="ductLocation">Duct location</Label>
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value as FormValues["ductLocation"])
											}
										>
											<SelectTrigger id="ductLocation">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="conditioned">
													Conditioned space
												</SelectItem>
												<SelectItem value="unconditioned">
													Unconditioned space
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
							{renderNumberField("ductEfficiency", "Duct efficiency (0-1)", {
								step: 0.05,
								min: 0,
								max: 1,
							})}
						</div>
					</section>

					<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
						<div className="flex items-center gap-2 text-white font-semibold">
							<Thermometer className="w-5 h-5 text-blue-400" />
							<h3>Climate preferences</h3>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							{renderNumberField("indoorTemp", "Indoor temperature (°F)", {
								min: 60,
								max: 80,
							})}
						</div>
					</section>

					{error && (
						<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 flex items-center gap-3">
							<div className="w-2 h-2 bg-red-500 rounded-full" />
							<p className="text-sm font-medium">{error}</p>
						</div>
					)}
					{typeof progress === "number" && (
						<div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50 text-blue-400">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
								<p className="text-sm font-medium">Calculating… {progress}%</p>
							</div>
							<div className="w-full bg-slate-700 rounded-full h-2">
								<div
									className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex items-center justify-between border-t border-slate-700 bg-slate-900/50 p-6">
					<Button
						type="button"
						variant="outline"
						onClick={(e) => {
							e.preventDefault();
							onBack();
						}}
						disabled={isCalculating}
						className="px-6 border-slate-700 hover:bg-slate-800"
						aria-label="Go back to location step"
					>
						← Back
					</Button>
					<Button 
						type="submit" 
						disabled={isCalculating}
						className="px-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
						aria-label={isCalculating ? "Calculating load" : "Generate calculation results"}
					>
						{isCalculating ? "Calculating…" : "Generate results →"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
