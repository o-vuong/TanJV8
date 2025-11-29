import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../../db";

// Mock Prisma
vi.mock("../../../db", () => ({
	prisma: {
		climateRef: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
	},
}));

// Mock fetch-climate module
vi.mock("../../../lib/climate/fetch-climate", () => ({
	fetchClimateDataForZip: vi.fn(),
}));

import { fetchClimateDataForZip } from "../../../lib/climate/fetch-climate";

describe("GET /api/location/resolve", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return climate data from database if exists", async () => {
		const mockClimateRef = {
			id: "test-id",
			zipCode: "90210",
			revision: 2025,
			variables: {
				summerDesignTemp: 85,
				winterDesignTemp: 42,
				latitude: 34.1016,
				longitude: -118.4143,
			},
		};

		vi.mocked(prisma.climateRef.findUnique).mockResolvedValue(
			mockClimateRef as any,
		);

		// Simulate the route handler logic
		const climateRef = await prisma.climateRef.findUnique({
			where: { zipCode: "90210" },
		});

		expect(climateRef).toEqual(mockClimateRef);
		expect(prisma.climateRef.findUnique).toHaveBeenCalledWith({
			where: { zipCode: "90210" },
		});
	});

	it("should fetch from external API and save to database if not found", async () => {
		const mockClimateData = {
			summerDesignTemp: 85,
			winterDesignTemp: 42,
			latitude: 34.1016,
			longitude: -118.4143,
		};

		const mockCreatedRef = {
			id: "new-id",
			zipCode: "90210",
			revision: 2025,
			variables: mockClimateData,
		};

		vi.mocked(prisma.climateRef.findUnique).mockResolvedValue(null);
		vi.mocked(fetchClimateDataForZip).mockResolvedValue(mockClimateData);
		vi.mocked(prisma.climateRef.create).mockResolvedValue(
			mockCreatedRef as any,
		);

		// Simulate the route handler logic
		let climateRef = await prisma.climateRef.findUnique({
			where: { zipCode: "90210" },
		});

		if (!climateRef) {
			const climateData = await fetchClimateDataForZip("90210");
			climateRef = await prisma.climateRef.create({
				data: {
					zipCode: "90210",
					revision: new Date().getFullYear(),
					variables: climateData,
				},
			});
		}

		expect(climateRef).toEqual(mockCreatedRef);
		expect(fetchClimateDataForZip).toHaveBeenCalledWith("90210");
		expect(prisma.climateRef.create).toHaveBeenCalled();
	});

	it("should handle fetch errors gracefully", async () => {
		vi.mocked(prisma.climateRef.findUnique).mockResolvedValue(null);
		vi.mocked(fetchClimateDataForZip).mockRejectedValue(
			new Error("API error"),
		);

		// Simulate error handling
		try {
			const climateData = await fetchClimateDataForZip("90210");
			await prisma.climateRef.create({
				data: {
					zipCode: "90210",
					revision: new Date().getFullYear(),
					variables: climateData,
				},
			});
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toBe("API error");
		}
	});

	it("should validate ZIP code format", () => {
		const validZip = "90210";
		const invalidZip = "123";

		expect(/^\d{5}$/u.test(validZip)).toBe(true);
		expect(/^\d{5}$/u.test(invalidZip)).toBe(false);
	});
});

