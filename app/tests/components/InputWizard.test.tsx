import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InputWizard } from '../../src/components/calculator/InputWizard'
import type { ClimateData } from '../../src/lib/queries/location'
import type { ManualJInputs, ManualJResults } from '@manualj/calc-engine'

// Mock the worker client
vi.mock('../../src/lib/workers/manualj-client', () => ({
	getManualJWorker: vi.fn(() => ({
		calculate: vi.fn(),
	})),
}))

// Mock session hook
vi.mock('../../src/lib/auth/client', () => ({
	useSession: vi.fn(() => ({ data: null })),
}))

// Mock storage
vi.mock('../../src/lib/storage/temporary', () => ({
	loadTemporaryFormState: vi.fn(() => null),
	saveTemporaryFormState: vi.fn(),
}))

import { getManualJWorker } from '../../src/lib/workers/manualj-client'

const mockGetWorker = vi.mocked(getManualJWorker)

describe('InputWizard', () => {
	let queryClient: QueryClient
	const mockClimateData: ClimateData = {
		climateRefId: 'test-id',
		variables: {
			summerDesignTemp: 85,
			winterDesignTemp: 42,
			latitude: 34.1016,
			longitude: -118.4143,
		},
		revision: 2025,
	}

	const mockResults: ManualJResults = {
		sensible: 15000,
		latent: 3000,
		total: 18000,
		tonnage: 1.5,
		cfm: 600,
		breakdown: {
			conduction: {
				walls: 5000,
				roof: 4000,
				windows: 2000,
			},
			solar: 3000,
			infiltration: 1500,
			internalGains: 2500,
			ductLosses: 1000,
		},
	}

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
		vi.clearAllMocks()

		const mockWorker = {
			calculate: vi.fn().mockResolvedValue(mockResults),
		}
		mockGetWorker.mockReturnValue(mockWorker as any)
	})

	const renderComponent = (onComplete = vi.fn(), onBack = vi.fn()) => {
		return render(
			<QueryClientProvider client={queryClient}>
				<InputWizard
					climateData={mockClimateData}
					onComplete={onComplete}
					onBack={onBack}
				/>
			</QueryClientProvider>,
		)
	}

	it('should render input wizard form', () => {
		renderComponent()

		expect(screen.getByText('Step 2: Building inputs')).toBeInTheDocument()
		expect(screen.getByLabelText(/Floor area/i)).toBeInTheDocument()
	})

	it('should display default form values', () => {
		renderComponent()

		const areaInput = screen.getByLabelText(/Floor area/i) as HTMLInputElement
		expect(areaInput.value).toBe('2400')
	})

	it('should validate required fields', async () => {
		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent()

		const areaInput = screen.getByLabelText(/Floor area/i)
		await userEvent.clear(areaInput)
		await userEvent.type(areaInput, '0')
		await userEvent.tab()

		await waitFor(() => {
			expect(screen.getByText(/Area must be positive/i)).toBeInTheDocument()
		})
	})

	it('should show loading state during calculation', async () => {
		const mockWorker = {
			calculate: vi.fn().mockImplementation(() => {
				return new Promise((resolve) => {
					setTimeout(() => resolve(mockResults), 100)
				})
			}),
		}
		mockGetWorker.mockReturnValue(mockWorker as any)

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent()

		const submitButton = screen.getByRole('button', { name: /Generate results/i })
		await userEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/Calculating…/i)).toBeInTheDocument()
		})
	})

	it('should call onComplete with inputs and results after calculation', async () => {
		const onComplete = vi.fn()

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent(onComplete)

		const submitButton = screen.getByRole('button', { name: /Generate results/i })
		await userEvent.click(submitButton)

		await waitFor(() => {
			expect(onComplete).toHaveBeenCalled()
			const call = onComplete.mock.calls[0]
			expect(call[0]).toMatchObject({
				area: expect.any(Number),
				climateRefId: mockClimateData.climateRefId,
				envelope: expect.any(Object),
				infiltration: expect.any(Object),
				internal: expect.any(Object),
				ducts: expect.any(Object),
				climate: expect.any(Object),
			} satisfies ManualJInputs)
			expect(call[1]).toEqual(mockResults)
		})
	})

	it('should display error message when calculation fails', async () => {
		const mockWorker = {
			calculate: vi.fn().mockRejectedValue(new Error('Calculation failed')),
		}
		mockGetWorker.mockReturnValue(mockWorker as any)

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent()

		const submitButton = screen.getByRole('button', { name: /Generate results/i })
		await userEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/Calculation failed/i)).toBeInTheDocument()
		})
	})

	it('should call onBack when back button is clicked', async () => {
		const onBack = vi.fn()

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent(vi.fn(), onBack)

		const backButton = screen.getByRole('button', { name: /Back/i })
		await userEvent.click(backButton)

		expect(onBack).toHaveBeenCalled()
	})

	it('should disable submit button during calculation', async () => {
		const mockWorker = {
			calculate: vi.fn().mockImplementation(() => {
				return new Promise((resolve) => {
					setTimeout(() => resolve(mockResults), 100)
				})
			}),
		}
		mockGetWorker.mockReturnValue(mockWorker as any)

		const { user } = await import('@testing-library/user-event')
		const userEvent = user.setup()

		renderComponent()

		const submitButton = screen.getByRole('button', { name: /Generate results/i })
		await userEvent.click(submitButton)

		await waitFor(() => {
			expect(submitButton).toBeDisabled()
		})
	})

	it('should validate numeric inputs correctly', async () => {
		const { user } = await import('@testing-library/user-event')
		const userEvent = user.setup()

		renderComponent()

		const wallRInput = screen.getByLabelText(/Wall R-value/i)
		await userEvent.clear(wallRInput)
		await userEvent.type(wallRInput, '-5')
		await userEvent.tab()

		await waitFor(() => {
			expect(screen.getByText(/Wall R-value must be positive/i)).toBeInTheDocument()
		})
	})
})

