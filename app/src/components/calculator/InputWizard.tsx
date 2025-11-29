import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Home } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import type { ClimateData } from "../../lib/queries/location";
import { useSession } from "../../lib/auth/client";
import {
	saveTemporaryFormState,
	loadTemporaryFormState,
} from "../../lib/storage/temporary";
import { getManualJWorker } from "../../lib/workers/manualj-client";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { BuildingDimensionsSection } from "./BuildingDimensionsSection";
import { BuildingEnvelopeSection } from "./BuildingEnvelopeSection";
import { InfiltrationSection } from "./InfiltrationSection";
import { InternalGainsSection } from "./InternalGainsSection";
import { DuctSystemSection } from "./DuctSystemSection";
import { ClimatePreferencesSection } from "./ClimatePreferencesSection";

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
	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [isCalculating, setIsCalculating] = useState(false);
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Load saved form state for unauthenticated users
	const savedFormState = loadTemporaryFormState();
	const defaultValues: FormValues = savedFormState
		? { ...savedFormState } as FormValues
		: {
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
			};

	const form = useForm<FormValues>({
		defaultValues,
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

	// Auto-save form state for unauthenticated users (debounced)
	useEffect(() => {
		if (isAuthenticated) return;

		// Clear existing timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Debounce save by 500ms
		saveTimeoutRef.current = setTimeout(() => {
			const formValues = form.state.values;
			if (formValues) {
				saveTemporaryFormState(formValues);
			}
		}, 500);

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [form.state.values, isAuthenticated, form]);

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
					<BuildingDimensionsSection form={form} fieldValidators={fieldValidators} />
					<BuildingEnvelopeSection form={form} fieldValidators={fieldValidators} />
					<InfiltrationSection form={form} fieldValidators={fieldValidators} />
					<InternalGainsSection form={form} fieldValidators={fieldValidators} />
					<DuctSystemSection form={form} fieldValidators={fieldValidators} />
					<ClimatePreferencesSection form={form} fieldValidators={fieldValidators} />

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
