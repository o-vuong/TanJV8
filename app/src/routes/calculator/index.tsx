import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Calculator } from "../../components/calculator/Calculator";

const calculatorSearchSchema = z.object({
	demo: z.boolean().optional(),
});

export const Route = createFileRoute("/calculator/")({
	validateSearch: calculatorSearchSchema,
	ssr: "spa-mode", // Client-only route since it uses client-side hooks and storage
	component: CalculatorPage,
});

function CalculatorPage() {
	const { demo } = Route.useSearch();

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight">
					Manual J Load Calculator
				</h1>
				<p className="text-muted-foreground">
					Enter project details to generate ACCA Manual J compliant heating and
					cooling loads.
				</p>
				{demo && (
					<div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400">
						<span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
						Demo Mode - Pre-filled with sample data
					</div>
				)}
			</header>
			<Calculator demoMode={demo || false} />
		</div>
	);
}
