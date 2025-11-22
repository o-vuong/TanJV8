import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import { useState } from "react";
import type { ClimateData } from "../../lib/queries/location";
import { InputWizard } from "./InputWizard";
import { LocationResolver } from "./LocationResolver";
import { ResultsDisplay } from "./ResultsDisplay";
import { type Step, StepIndicator } from "./StepIndicator";

export function Calculator() {
	const [step, setStep] = useState<Step>("location");
	const [climateData, setClimateData] = useState<ClimateData | null>(null);
	const [inputs, setInputs] = useState<ManualJInputs | null>(null);
	const [results, setResults] = useState<ManualJResults | null>(null);

	const handleLocationComplete = (data: ClimateData) => {
		setClimateData(data);
		setStep("inputs");
	};

	const handleInputsComplete = (
		nextInputs: ManualJInputs,
		nextResults: ManualJResults,
	) => {
		setInputs(nextInputs);
		setResults(nextResults);
		setStep("results");
	};

	const startNewCalculation = () => {
		setClimateData(null);
		setInputs(null);
		setResults(null);
		setStep("location");
	};

	return (
		<div className="space-y-8">
			<StepIndicator currentStep={step} />

			{step === "location" && (
				<LocationResolver onComplete={handleLocationComplete} />
			)}

			{step === "inputs" && climateData && (
				<InputWizard
					climateData={climateData}
					onBack={() => setStep("location")}
					onComplete={handleInputsComplete}
				/>
			)}

			{step === "results" && inputs && results && (
				<ResultsDisplay
					inputs={inputs}
					results={results}
					onBack={() => setStep("inputs")}
					onStartNew={startNewCalculation}
				/>
			)}
		</div>
	);
}
