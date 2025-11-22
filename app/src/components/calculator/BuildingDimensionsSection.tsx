import { Home } from "lucide-react";
import type { FormSectionProps } from "./form-utils";
import { renderNumberField } from "./form-utils";

export function BuildingDimensionsSection({ form, fieldValidators }: FormSectionProps) {
	return (
		<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
			<div className="space-y-1">
				<div className="flex items-center gap-2 text-white font-semibold">
					<Home className="w-5 h-5 text-blue-400" />
					<h3>Building dimensions</h3>
				</div>
				<p className="text-sm text-gray-400 ml-7">
					Enter the overall size and height of your building
				</p>
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

