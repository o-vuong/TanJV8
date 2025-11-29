import { Square } from "lucide-react";
import type { FormSectionProps } from "./form-utils";
import { renderNumberField } from "./form-utils";

export function BuildingEnvelopeSection({ form, fieldValidators }: FormSectionProps) {
	return (
		<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
			<div className="space-y-1">
				<div className="flex items-center gap-2 text-white font-semibold">
					<Square className="w-5 h-5 text-blue-400" />
					<h3>Building envelope</h3>
				</div>
				<p className="text-sm text-gray-400 ml-7">
					Define the thermal properties of walls, roof, and windows
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{renderNumberField(
					form,
					fieldValidators,
					"wallArea",
					"Wall Area",
					"Total exterior wall area in square feet",
					{ min: 0 },
					"sq ft"
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
					{ min: 0 },
					"sq ft"
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
					{ min: 0 },
					"sq ft"
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

