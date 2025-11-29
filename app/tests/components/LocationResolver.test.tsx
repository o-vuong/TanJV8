import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocationResolver } from '../../src/components/calculator/LocationResolver'
import type { ClimateData } from '../../src/lib/queries/location'

// Mock the useResolveLocation hook
vi.mock('../../src/lib/queries/location', () => ({
	useResolveLocation: vi.fn(),
}))

import { useResolveLocation } from '../../src/lib/queries/location'

const mockUseResolveLocation = vi.mocked(useResolveLocation)

describe('LocationResolver', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
		vi.clearAllMocks()
	})

	const renderComponent = (onComplete = vi.fn()) => {
		return render(
			<QueryClientProvider client={queryClient}>
				<LocationResolver onComplete={onComplete} />
			</QueryClientProvider>,
		)
	}

	it('should render location resolver form', () => {
		mockUseResolveLocation.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
		} as any)

		renderComponent()

		expect(screen.getByText('Step 1: Locate the property')).toBeInTheDocument()
		expect(screen.getByLabelText('ZIP Code')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Resolve location/i })).toBeInTheDocument()
	})

	it('should validate ZIP code format', async () => {
		mockUseResolveLocation.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
		} as any)

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent()

		const zipInput = screen.getByLabelText('ZIP Code')
		await userEvent.type(zipInput, '123')
		await userEvent.tab()

		await waitFor(() => {
			expect(screen.getByText(/ZIP code must be 5 digits/i)).toBeInTheDocument()
		})
	})

	it('should display loading state when resolving location', () => {
		mockUseResolveLocation.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		} as any)

		renderComponent()

		expect(screen.getByText(/Resolving climate data…/i)).toBeInTheDocument()
	})

	it('should display error message when location resolution fails', () => {
		mockUseResolveLocation.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new Error('Failed to resolve location'),
		} as any)

		renderComponent()

		expect(screen.getByText(/Failed to resolve location/i)).toBeInTheDocument()
	})

	it('should display climate data when resolved', () => {
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

		mockUseResolveLocation.mockReturnValue({
			data: mockClimateData,
			isLoading: false,
			error: null,
		} as any)

		renderComponent()

		expect(screen.getByText('85°F')).toBeInTheDocument()
		expect(screen.getByText('42°F')).toBeInTheDocument()
		expect(screen.getByText('34.1016°')).toBeInTheDocument()
		expect(screen.getByText('-118.4143°')).toBeInTheDocument()
	})

	it('should call onComplete when location is resolved and form is submitted', async () => {
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

		const onComplete = vi.fn()

		mockUseResolveLocation.mockReturnValue({
			data: mockClimateData,
			isLoading: false,
			error: null,
		} as any)

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent(onComplete)

		const zipInput = screen.getByLabelText('ZIP Code')
		await userEvent.clear(zipInput)
		await userEvent.type(zipInput, '90210')

		const submitButton = screen.getByRole('button', { name: /Continue/i })
		await userEvent.click(submitButton)

		await waitFor(() => {
			expect(onComplete).toHaveBeenCalledWith(mockClimateData)
		})
	})

	it('should only allow numeric input in ZIP code field', async () => {
		mockUseResolveLocation.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
		} as any)

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent()

		const zipInput = screen.getByLabelText('ZIP Code') as HTMLInputElement
		await userEvent.type(zipInput, 'abc123')

		expect(zipInput.value).toBe('123')
	})

	it('should limit ZIP code input to 5 digits', async () => {
		mockUseResolveLocation.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
		} as any)

		const userEvent = (await import('@testing-library/user-event')).default

		renderComponent()

		const zipInput = screen.getByLabelText('ZIP Code') as HTMLInputElement
		await userEvent.type(zipInput, '1234567890')

		expect(zipInput.value.length).toBeLessThanOrEqual(5)
	})
})

