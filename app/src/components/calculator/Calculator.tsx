import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import { useState, useEffect } from "react";
import type { ClimateData } from "../../lib/queries/location";
import { useSession } from "../../lib/auth/client";
import {
	saveCurrentCalculation,
	loadCurrentCalculation,
	addTemporaryCalculation,
	getTemporaryCalculationsCount,
} from "../../lib/storage/temporary";
import { InputWizard } from "./InputWizard";
import { LocationResolver } from "./LocationResolver";
import { ResultsDisplay } from "./ResultsDisplay";
import { type Step, StepIndicator } from "./StepIndicator";

interface CalculatorProps {
	demoMode?: boolean;
}

export function Calculator({ demoMode = false }: CalculatorProps) {
	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;

	const [step, setStep] = useState<Step>("location");
	const [climateData, setClimateData] = useState<ClimateData | null>(null);
	const [inputs, setInputs] = useState<ManualJInputs | null>(null);
	const [results, setResults] = useState<ManualJResults | null>(null);

	// Load current calculation being worked on if user is not authenticated
	useEffect(() => {
		if (!isAuthenticated && !demoMode) {
			const current = loadCurrentCalculation();
			if (current.climateData || current.inputs || current.results) {
				if (current.climateData) {
					setClimateData(current.climateData);
				}
				if (current.inputs) {
					setInputs(current.inputs);
				}
				if (current.results) {
					setResults(current.results);
				}

				// Determine current step based on what data we have
				if (current.results && current.inputs) {
					setStep("results");
				} else if (current.inputs && current.climateData) {
					setStep("inputs");
				} else if (current.climateData) {
					setStep("inputs");
				}
			}
		}
	}, [isAuthenticated, demoMode]);

	const handleLocationComplete = (data: ClimateData) => {
		setClimateData(data);
		setStep("inputs");
		// Save current calculation state if not authenticated
		if (!isAuthenticated && !demoMode) {
			saveCurrentCalculation(data, null, null);
		}
	};

	const handleInputsComplete = (
		nextInputs: ManualJInputs,
		nextResults: ManualJResults,
	) => {
		setInputs(nextInputs);
		setResults(nextResults);
		setStep("results");
		// Save current calculation state if not authenticated
		if (!isAuthenticated && !demoMode) {
			saveCurrentCalculation(climateData!, nextInputs, nextResults);
		}
	};

	const startNewCalculation = () => {
		// Save current calculation to the array before starting new one
		if (!isAuthenticated && !demoMode && climateData && inputs && results) {
			const calcCount = getTemporaryCalculationsCount();
			addTemporaryCalculation(
				climateData,
				inputs,
				results,
				`Calculation ${calcCount + 1}`,
			);
		}

		// Clear current calculation state
		setClimateData(null);
		setInputs(null);
		setResults(null);
		setStep("location");
		
		// Clear current calculation from storage
		if (!isAuthenticated && !demoMode) {
			saveCurrentCalculation(null, null, null);
		}
	};

	return (
		<div className="space-y-8">
			<StepIndicator currentStep={step} />

			{step === "location" && (
				<LocationResolver onComplete={handleLocationComplete} demoMode={demoMode} />
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
