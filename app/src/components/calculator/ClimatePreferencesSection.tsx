import { Thermometer } from "lucide-react";
import type { FormSectionProps } from "./form-utils";
import { renderNumberField } from "./form-utils";

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

