import { createFileRoute } from '@tanstack/react-router'
import { Calculator } from '../../components/calculator/Calculator'

export const Route = createFileRoute('/calculator/')({
  component: () => (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Manual J Load Calculator</h1>
        <p className="text-muted-foreground">
          Enter project details to generate ACCA Manual J compliant heating and cooling loads.
        </p>
      </header>
      <Calculator />
    </div>
  ),
})
