import { Gauge } from "lucide-react";
import type { FormSectionProps, FormValues } from "./form-utils";
import { getErrorMessage, renderNumberField } from "./form-utils";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

export function DuctSystemSection({ form, fieldValidators }: FormSectionProps) {
	return (
		<section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
			<div className="space-y-1">
				<div className="flex items-center gap-2 text-white font-semibold">
					<Gauge className="w-5 h-5 text-blue-400" />
					<h3>Duct system</h3>
				</div>
				<p className="text-sm text-gray-400 ml-7">
					Configure HVAC ductwork location and efficiency for distribution losses
				</p>
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
					{ step: 0.05, min: 0, max: 1 },
					"%"
				)}
			</div>
		</section>
	);
}

