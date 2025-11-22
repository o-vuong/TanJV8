import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
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
		<Card>
			<CardHeader>
				<CardTitle>Step 2: Building inputs</CardTitle>
			</CardHeader>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<CardContent className="space-y-6">
					<section className="grid gap-4 sm:grid-cols-2">
						{renderNumberField("area", "Floor area (sq ft)", { min: 1 })}
						{renderNumberField("ceilingHeight", "Ceiling height (ft)", {
							min: 1,
						})}
					</section>

					<section className="space-y-3">
						<h3 className="text-sm font-semibold text-muted-foreground">
							Envelope
						</h3>
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

					<section className="space-y-3">
						<h3 className="text-sm font-semibold text-muted-foreground">
							Infiltration
						</h3>
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

					<section className="space-y-3">
						<h3 className="text-sm font-semibold text-muted-foreground">
							Internal gains
						</h3>
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

					<section className="space-y-3">
						<h3 className="text-sm font-semibold text-muted-foreground">
							Ducts
						</h3>
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

					<section className="grid gap-4 sm:grid-cols-2">
						{renderNumberField("indoorTemp", "Indoor temperature (°F)", {
							min: 60,
							max: 80,
						})}
					</section>

					{error && <p className="text-sm text-destructive">{error}</p>}
					{typeof progress === "number" && (
						<p className="text-sm text-muted-foreground">
							Calculating… {progress}%
						</p>
					)}
				</CardContent>
				<CardFooter className="flex items-center justify-between">
					<Button
						type="button"
						variant="outline"
						onClick={onBack}
						disabled={isCalculating}
					>
						Back
					</Button>
					<Button type="submit" disabled={isCalculating}>
						{isCalculating ? "Calculating…" : "Generate results"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
