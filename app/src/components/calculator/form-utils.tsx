import type { UseFormReturn } from "@tanstack/react-form";
import type { InputHTMLAttributes } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

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

// Helper to extract error message from Zod error or string
export const getErrorMessage = (error: unknown): string => {
	if (typeof error === 'string') return error;
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}
	return 'Invalid value';
};

export const renderNumberField = (
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

export interface FormSectionProps {
	form: UseFormReturn<FormValues, any>;
	fieldValidators: FieldValidators;
}

