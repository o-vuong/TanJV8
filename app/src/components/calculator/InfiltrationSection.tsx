import { Wind } from "lucide-react";
import type { FormSectionProps, FormValues } from "./form-utils";
import { getErrorMessage } from "./form-utils";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

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

