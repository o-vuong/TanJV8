import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import type { ClimateData } from "../../lib/queries/location";
import { useResolveLocation } from "../../lib/queries/location";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const locationSchema = z.object({
	zipCode: z
		.string()
		.min(1, "ZIP code is required")
		.regex(/^\d{5}$/u, "ZIP code must be 5 digits"),
});

// Helper to extract error message from Zod error or string
const getErrorMessage = (error: unknown): string => {
	if (typeof error === 'string') return error;
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}
	return 'Invalid value';
};

type LocationResolverProps = {
	onComplete: (data: ClimateData) => void;
	demoMode?: boolean;
};

export function LocationResolver({ onComplete, demoMode = false }: LocationResolverProps) {
	const [submittedZip, setSubmittedZip] = useState<string | null>(demoMode ? "30301" : null);
	const form = useForm({
		defaultValues: {
			zipCode: demoMode ? "30301" : "",
		},
		validatorAdapter: zodValidator,
		onSubmit: ({ value }) => {
			setSubmittedZip(value.zipCode);
		},
	});

	const currentZip = submittedZip ?? form.state.values.zipCode;
	const { data, isLoading, error } = useResolveLocation(
		currentZip && /^\d{5}$/u.test(currentZip) ? currentZip : undefined,
	);

	useEffect(() => {
		if (data && submittedZip && /^\d{5}$/u.test(submittedZip)) {
			onComplete(data);
		}
	}, [data, submittedZip, onComplete]);

	return (
		<Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
			<CardHeader className="border-b border-slate-700 bg-slate-900/50">
				<CardTitle className="text-2xl flex items-center gap-3">
					<div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
						<MapPin className="w-6 h-6 text-white" />
					</div>
					Step 1: Locate the property
				</CardTitle>
				<CardDescription className="text-gray-400 mt-2">
					Enter the project ZIP code to load climate design conditions.
				</CardDescription>
			</CardHeader>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<CardContent className="space-y-6 p-6">
					<form.Field
						name="zipCode"
						validators={{ onChange: locationSchema.shape.zipCode }}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>ZIP Code</Label>
								<Input
									id={field.name}
									inputMode="numeric"
									maxLength={5}
									value={field.state.value}
									onChange={(event) => {
										// Only allow digits, limit to 5 characters
										const value = event.target.value.replace(/\D/g, '').slice(0, 5);
										field.handleChange(value);
									}}
									onBlur={field.handleBlur}
									placeholder="e.g. 91730"
									autoFocus
									className="w-full"
								/>
								<p className="text-xs text-gray-400">
									ZIP code where you are building
								</p>
								{field.state.meta.errors?.[0] && (
									<p className="text-sm text-destructive">
										{getErrorMessage(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{error && (
						<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 flex items-center gap-3">
							<div className="w-2 h-2 bg-red-500 rounded-full" />
							<p className="text-sm font-medium">{error.message}</p>
						</div>
					)}

					{isLoading && (
						<div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50 text-blue-400 flex items-center gap-3">
							<Loader2 className="w-4 h-4 animate-spin" />
							<p className="text-sm font-medium">Resolving climate data…</p>
						</div>
					)}

					{data && (
						<dl className="grid gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-5 text-sm sm:grid-cols-2">
							<div className="space-y-1">
								<dt className="text-xs text-gray-500 uppercase tracking-wide">Summer design temp</dt>
								<dd className="text-xl font-bold text-blue-400">
									{data.variables.summerDesignTemp}°F
								</dd>
							</div>
							<div className="space-y-1">
								<dt className="text-xs text-gray-500 uppercase tracking-wide">Winter design temp</dt>
								<dd className="text-xl font-bold text-cyan-400">
									{data.variables.winterDesignTemp}°F
								</dd>
							</div>
							<div className="space-y-1">
								<dt className="text-xs text-gray-500 uppercase tracking-wide">Latitude</dt>
								<dd className="text-base font-medium text-white">
									{data.variables.latitude.toFixed(4)}°
								</dd>
							</div>
							<div className="space-y-1">
								<dt className="text-xs text-gray-500 uppercase tracking-wide">Longitude</dt>
								<dd className="text-base font-medium text-white">
									{data.variables.longitude.toFixed(4)}°
								</dd>
							</div>
						</dl>
					)}
				</CardContent>
				<CardFooter className="flex justify-end border-t border-slate-700 bg-slate-900/50 p-6">
					<Button
						type="submit"
						disabled={
							form.state.isValidating || form.state.isSubmitting || isLoading
						}
						className="px-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
					>
						{data && /^\d{5}$/u.test(currentZip ?? "")
							? "Continue →"
							: "Resolve location"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
