import type { UseFormReturn } from "@tanstack/react-form";
import { Home, Square, Wind, Users, Gauge, Thermometer } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

// Helper to extract error message from Zod error or string
const getErrorMessage = (error: unknown): string => {
	if (typeof error === 'string') return error;
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}
	return 'Invalid value';
};

export type FormValues = {
	area: number;
	ceilingHeight: number;
	wallArea: number;
	wallR: number;
	roofArea: number;
	roofR: number;
	windowArea: number;
	windowU: number;
	windowSHGC: number;
	infiltrationClass: "tight" | "average" | "loose";
	occupants: number;
	lighting: number;
	appliances: number;
	ductLocation: "conditioned" | "unconditioned";
	ductEfficiency: number;
	indoorTemp: number;
};

export type FieldValidators = Record<keyof FormValues, any>;

interface FormSectionProps {
	form: UseFormReturn<FormValues, any>;
	fieldValidators: FieldValidators;
}

const renderNumberField = (
	form: UseFormReturn<FormValues, any>,
	fieldValidators: FieldValidators,
	name: keyof FormValues,
	label: string,
	description?: string,
	props?: InputHTMLAttributes<HTMLInputElement>,
) => (
	<form.Field name={name} validators={{ onChange: fieldValidators[name] }}>
		{(field) => {
			const defaultValue = form.options.defaultValues?.[name] ?? 0;
			const displayValue = field.state.value ?? defaultValue;
			
			return (
				<div className="space-y-2">
					<Label htmlFor={String(name)}>{label}</Label>
					<Input
						id={String(name)}
						type="number"
						value={displayValue}
						onChange={(event) => {
							const value = event.target.value;
							if (value === "" || value === "-" || value === ".") {
								field.handleChange(defaultValue);
								return;
							}
							const numValue = Number(value);
							if (!isNaN(numValue)) {
								field.handleChange(numValue);
							}
						}}
						onBlur={(event) => {
							const value = event.target.value;
							if (value === "" || isNaN(Number(value))) {
								field.handleChange(defaultValue);
							}
							field.handleBlur();
						}}
						className="w-full"
						{...props}
					/>
					{description && (
						<p className="text-xs text-gray-400">
							{description}
						</p>
					)}
					{field.state.meta.errors?.[0] && (
						<p className="text-sm text-destructive">
							{getErrorMessage(field.state.meta.errors[0])}
						</p>
					)}
				</div>
			);
		}}
	</form.Field>
);

export function BuildingDimensionsSection({ form, fieldValidators }: FormSectionProps) {
	return (
		<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
			<div className="flex items-center gap-2 text-white font-semibold">
				<Home className="w-5 h-5 text-blue-400" />
				<h3>Building dimensions</h3>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{renderNumberField(
					form,
					fieldValidators,
					"area",
					"Floor Area",
					"Total floor area of the building in square feet",
					{ min: 1 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"ceilingHeight",
					"Ceiling Height",
					"Average ceiling height in feet",
					{ min: 1 }
				)}
			</div>
		</section>
	);
}

export function BuildingEnvelopeSection({ form, fieldValidators }: FormSectionProps) {
	return (
		<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
			<div className="flex items-center gap-2 text-white font-semibold">
				<Square className="w-5 h-5 text-blue-400" />
				<h3>Building envelope</h3>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{renderNumberField(
					form,
					fieldValidators,
					"wallArea",
					"Wall Area",
					"Total exterior wall area in square feet",
					{ min: 0 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"wallR",
					"Wall R-Value",
					"Thermal resistance of walls (higher is better)",
					{ min: 1, step: 0.1 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"roofArea",
					"Roof Area",
					"Total roof/ceiling area in square feet",
					{ min: 0 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"roofR",
					"Roof R-Value",
					"Thermal resistance of roof (higher is better)",
					{ min: 1, step: 0.1 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"windowArea",
					"Window Area",
					"Total window area in square feet",
					{ min: 0 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"windowU",
					"Window U-Factor",
					"Window heat transfer coefficient (lower is better, typically 0.2-1.0)",
					{ step: 0.01, min: 0.01, max: 2 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"windowSHGC",
					"Window SHGC",
					"Solar Heat Gain Coefficient (0-1, lower reduces solar heat gain)",
					{ step: 0.05, min: 0, max: 1 }
				)}
			</div>
		</section>
	);
}

export function InfiltrationSection({ form, fieldValidators }: FormSectionProps) {
	return (
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
							<Label htmlFor="infiltrationClass">Infiltration Class</Label>
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
							<p className="text-xs text-gray-400">
								Air tightness of the building envelope
							</p>
							{field.state.meta.errors?.[0] && (
								<p className="text-sm text-destructive">
									{getErrorMessage(field.state.meta.errors[0])}
								</p>
							)}
						</div>
					)}
				</form.Field>
			</div>
		</section>
	);
}

export function InternalGainsSection({ form, fieldValidators }: FormSectionProps) {
	return (
		<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
			<div className="flex items-center gap-2 text-white font-semibold">
				<Users className="w-5 h-5 text-blue-400" />
				<h3>Internal gains</h3>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				{renderNumberField(
					form,
					fieldValidators,
					"occupants",
					"Occupants",
					"Number of people in the building",
					{ min: 0, step: 1 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"lighting",
					"Lighting",
					"Total lighting load in watts",
					{ min: 0, step: 10 }
				)}
				{renderNumberField(
					form,
					fieldValidators,
					"appliances",
					"Appliances",
					"Total appliance load in watts",
					{ min: 0, step: 10 }
				)}
			</div>
		</section>
	);
}

export function DuctSystemSection({ form, fieldValidators }: FormSectionProps) {
	return (
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
							<Label htmlFor="ductLocation">Duct Location</Label>
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
							<p className="text-xs text-gray-400">
								Location of ductwork relative to conditioned space
							</p>
							{field.state.meta.errors?.[0] && (
								<p className="text-sm text-destructive">
									{getErrorMessage(field.state.meta.errors[0])}
								</p>
							)}
						</div>
					)}
				</form.Field>
				{renderNumberField(
					form,
					fieldValidators,
					"ductEfficiency",
					"Duct Efficiency",
					"Duct system efficiency (0-1, higher is better)",
					{ step: 0.05, min: 0, max: 1 }
				)}
			</div>
		</section>
	);
}

export function ClimatePreferencesSection({ form, fieldValidators }: FormSectionProps) {
	return (
		<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
			<div className="flex items-center gap-2 text-white font-semibold">
				<Thermometer className="w-5 h-5 text-blue-400" />
				<h3>Climate preferences</h3>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{renderNumberField(
					form,
					fieldValidators,
					"indoorTemp",
					"Indoor Temperature",
					"Desired indoor temperature in Fahrenheit",
					{ min: 60, max: 80 }
				)}
			</div>
		</section>
	);
}

