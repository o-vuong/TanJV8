import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchClimateDataForZip } from "./fetch-climate";
import { env } from "../env";

// Mock the env module
vi.mock("../env", () => ({
	env: {
		CLIMATE_SERVICE_URL: undefined,
		OPENCAGE_API_KEY: undefined,
	},
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchClimateDataForZip", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset env mocks
		vi.mocked(env).CLIMATE_SERVICE_URL = undefined;
		vi.mocked(env).OPENCAGE_API_KEY = undefined;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Python microservice integration", () => {
		it("should call Python service when CLIMATE_SERVICE_URL is set", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = "http://localhost:8000";
			
			const mockResponse = {
				zipCode: "90210",
				summerDesignTemp: 85.0,
				winterDesignTemp: 42.0,
				latitude: 34.1016,
				longitude: -118.4143,
				source: "noaa",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await fetchClimateDataForZip("90210");

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:8000/climate/90210",
				expect.objectContaining({
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}),
			);

			expect(result).toEqual({
				summerDesignTemp: 85.0,
				winterDesignTemp: 42.0,
				latitude: 34.1016,
				longitude: -118.4143,
			});
		});

		it("should fallback to geocoding when Python service returns 404", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = "http://localhost:8000";

			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			const result = await fetchClimateDataForZip("90210");

			// Should fallback to geocoding estimation
			expect(result).toHaveProperty("summerDesignTemp");
			expect(result).toHaveProperty("winterDesignTemp");
			expect(result).toHaveProperty("latitude");
			expect(result).toHaveProperty("longitude");
			expect(typeof result.summerDesignTemp).toBe("number");
			expect(typeof result.winterDesignTemp).toBe("number");
		});

		it("should fallback to geocoding when Python service times out", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = "http://localhost:8000";

			mockFetch.mockRejectedValueOnce(new Error("Timeout"));

			const result = await fetchClimateDataForZip("90210");

			// Should fallback to geocoding estimation
			expect(result).toHaveProperty("summerDesignTemp");
			expect(result).toHaveProperty("winterDesignTemp");
			expect(result).toHaveProperty("latitude");
			expect(result).toHaveProperty("longitude");
		});

		it("should fallback to geocoding when Python service is not configured", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = undefined;

			const result = await fetchClimateDataForZip("90210");

			// Should not call Python service
			expect(mockFetch).not.toHaveBeenCalled();

			// Should use geocoding fallback
			expect(result).toHaveProperty("summerDesignTemp");
			expect(result).toHaveProperty("winterDesignTemp");
			expect(result).toHaveProperty("latitude");
			expect(result).toHaveProperty("longitude");
		});
	});

	describe("Geocoding fallback", () => {
		it("should estimate coordinates for East Coast ZIP codes", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = undefined;

			const result = await fetchClimateDataForZip("10001");

			// Should return valid coordinates (estimation is rough)
			expect(typeof result.latitude).toBe("number");
			expect(typeof result.longitude).toBe("number");
			expect(result.latitude).toBeGreaterThan(-90);
			expect(result.latitude).toBeLessThan(90);
			expect(result.longitude).toBeGreaterThan(-180);
			expect(result.longitude).toBeLessThan(180);
		});

		it("should estimate coordinates for West Coast ZIP codes", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = undefined;

			const result = await fetchClimateDataForZip("90210");

			// Should return valid coordinates (estimation is rough)
			expect(typeof result.latitude).toBe("number");
			expect(typeof result.longitude).toBe("number");
			expect(result.latitude).toBeGreaterThan(-90);
			expect(result.latitude).toBeLessThan(90);
			expect(result.longitude).toBeGreaterThan(-180);
			expect(result.longitude).toBeLessThan(180);
		});

		it("should estimate coordinates for Midwest ZIP codes", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = undefined;

			const result = await fetchClimateDataForZip("60601");

			// Should return valid coordinates (estimation is rough)
			expect(typeof result.latitude).toBe("number");
			expect(typeof result.longitude).toBe("number");
			expect(result.latitude).toBeGreaterThan(-90);
			expect(result.latitude).toBeLessThan(90);
			expect(result.longitude).toBeGreaterThan(-180);
			expect(result.longitude).toBeLessThan(180);
		});

		it("should return valid design temperatures", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = undefined;

			const result = await fetchClimateDataForZip("90210");

			// Design temperatures should be within reasonable bounds
			expect(result.summerDesignTemp).toBeGreaterThanOrEqual(75);
			expect(result.summerDesignTemp).toBeLessThanOrEqual(105);
			expect(result.winterDesignTemp).toBeGreaterThanOrEqual(-20);
			expect(result.winterDesignTemp).toBeLessThanOrEqual(50);
		});

		it("should return different temperatures for different regions", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = undefined;

			const coldResult = await fetchClimateDataForZip("60601"); // Chicago
			const warmResult = await fetchClimateDataForZip("90210"); // LA

			// Chicago should have colder winter temps than LA
			expect(coldResult.winterDesignTemp).toBeLessThan(
				warmResult.winterDesignTemp,
			);
		});
	});

	describe("Error handling", () => {
		it("should handle invalid ZIP code format gracefully", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = undefined;

			// Should still return a result (with fallback estimation)
			const result = await fetchClimateDataForZip("00000");

			expect(result).toHaveProperty("summerDesignTemp");
			expect(result).toHaveProperty("winterDesignTemp");
			expect(result).toHaveProperty("latitude");
			expect(result).toHaveProperty("longitude");
		});

		it("should handle network errors gracefully", async () => {
			vi.mocked(env).CLIMATE_SERVICE_URL = "http://localhost:8000";

			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const result = await fetchClimateDataForZip("90210");

			// Should fallback to geocoding
			expect(result).toHaveProperty("summerDesignTemp");
			expect(result).toHaveProperty("winterDesignTemp");
		});
	});
});

