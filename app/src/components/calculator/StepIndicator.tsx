interface StepIndicatorProps {
  currentStep: Step
}

export type Step = 'location' | 'inputs' | 'results'

const steps: Array<{ id: Step; label: string }> = [
  { id: 'location', label: 'Location' },
  { id: 'inputs', label: 'Building Inputs' },
  { id: 'results', label: 'Results' },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <ol className="flex items-center justify-center gap-6 text-sm sm:text-base">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = steps.findIndex((s) => s.id === currentStep) > index
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted-foreground/40 text-muted-foreground'
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`font-medium ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
