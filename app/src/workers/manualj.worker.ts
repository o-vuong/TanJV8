import { calculateManualJ } from '@manualj/calc-engine'
import type { BuildingInputs, CalculationResults } from '@manualj/calc-engine'

export interface WorkerMessage {
  id: string
  type: 'CALCULATE' | 'CANCEL'
  inputs?: BuildingInputs
}

export interface WorkerResponse {
  id: string
  type: 'RESULT' | 'ERROR' | 'PROGRESS'
  results?: CalculationResults
  error?: string
  progress?: number
}

let currentId: string | null = null
let cancelled = false

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { id, type, inputs } = event.data

  switch (type) {
    case 'CALCULATE': {
      if (!inputs) {
        self.postMessage({ id, type: 'ERROR', error: 'No inputs provided' } satisfies WorkerResponse)
        return
      }

      currentId = id
      cancelled = false

      self.postMessage({ id, type: 'PROGRESS', progress: 10 } satisfies WorkerResponse)

      queueMicrotask(() => {
        if (cancelled) return
        try {
          const results = calculateManualJ(inputs)
          self.postMessage({ id, type: 'PROGRESS', progress: 90 } satisfies WorkerResponse)
          if (!cancelled) {
            self.postMessage({ id, type: 'RESULT', results } satisfies WorkerResponse)
          }
        } catch (error) {
          if (!cancelled) {
            self.postMessage({
              id,
              type: 'ERROR',
              error: error instanceof Error ? error.message : 'Calculation failed',
            } satisfies WorkerResponse)
          }
        } finally {
          currentId = null
        }
      })
      break
    }
    case 'CANCEL': {
      if (currentId === id) {
        cancelled = true
        currentId = null
      }
      break
    }
  }
}
