import { useState } from 'react'
import type { BuildingInputs, CalculationResults } from '@manualj/calc-engine'
import type { ClimateData } from '../../lib/queries/location'
import { StepIndicator, type Step } from './StepIndicator'
import { LocationResolver } from './LocationResolver'
import { InputWizard } from './InputWizard'
import { ResultsDisplay } from './ResultsDisplay'

export function Calculator() {
  const [step, setStep] = useState<Step>('location')
  const [climateData, setClimateData] = useState<ClimateData | null>(null)
  const [inputs, setInputs] = useState<BuildingInputs | null>(null)
  const [results, setResults] = useState<CalculationResults | null>(null)

  const handleLocationComplete = (data: ClimateData) => {
    setClimateData(data)
    setStep('inputs')
  }

  const handleInputsComplete = (nextInputs: BuildingInputs, nextResults: CalculationResults) => {
    setInputs(nextInputs)
    setResults(nextResults)
    setStep('results')
  }

  const startNewCalculation = () => {
    setClimateData(null)
    setInputs(null)
    setResults(null)
    setStep('location')
  }

  return (
    <div className="space-y-8">
      <StepIndicator currentStep={step} />

      {step === 'location' && <LocationResolver onComplete={handleLocationComplete} />}

      {step === 'inputs' && climateData && (
        <InputWizard
          climateData={climateData}
          onBack={() => setStep('location')}
          onComplete={handleInputsComplete}
        />
      )}

      {step === 'results' && inputs && results && (
        <ResultsDisplay
          inputs={inputs}
          results={results}
          onBack={() => setStep('inputs')}
          onStartNew={startNewCalculation}
        />
      )}
    </div>
  )
}
