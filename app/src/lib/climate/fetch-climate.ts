import { env } from "../env";

interface GeocodeResult {
	latitude: number;
	longitude: number;
}

interface ClimateEstimate {
	summerDesignTemp: number;
	winterDesignTemp: number;
	latitude: number;
	longitude: number;
}

/**
 * Estimate design temperatures based on latitude and general climate patterns
 * These are rough estimates based on US climate zones and should be replaced
 * with actual ACCA Manual J data when available.
 */
function estimateDesignTemperatures(
	latitude: number,
	longitude: number,
): { summerDesignTemp: number; winterDesignTemp: number } {
	// Rough estimates based on latitude and general US climate patterns
	// These are simplified and should be replaced with actual climate zone data
	
	// Base temperatures on latitude
	let summerDesignTemp = 85;
	let winterDesignTemp = 30;

	// Adjust based on latitude (higher latitude = colder winters, cooler summers)
	const latAdjustment = (latitude - 35) * 1.5; // Base at ~35°N
	winterDesignTemp -= latAdjustment;
	summerDesignTemp -= latAdjustment * 0.3;

	// Adjust for coastal vs inland (rough estimate based on longitude)
	// West coast (CA, OR, WA) - milder temperatures
	if (longitude < -120) {
		winterDesignTemp += 10;
		summerDesignTemp -= 5;
	}
	// East coast - more variable
	else if (longitude > -80) {
		winterDesignTemp -= 5;
	}

	// Ensure reasonable bounds
	summerDesignTemp = Math.max(75, Math.min(105, summerDesignTemp));
	winterDesignTemp = Math.max(-20, Math.min(50, winterDesignTemp));

	return {
		summerDesignTemp: Math.round(summerDesignTemp),
		winterDesignTemp: Math.round(winterDesignTemp),
	};
}

/**
 * Geocode a ZIP code to get latitude and longitude
 * Uses OpenCage Geocoding API (free tier available)
 */
async function geocodeZipCode(zipCode: string): Promise<GeocodeResult> {
	const apiKey = env.OPENCAGE_API_KEY;
	
	if (!apiKey) {
		// Fallback: Use a simple estimation based on ZIP code ranges
		// This is a very rough approximation
		const zipNum = parseInt(zipCode, 10);
		
		// Rough geographic estimates based on ZIP code ranges
		let latitude = 39.0; // Default to middle US
		let longitude = -98.0;
		
		// East Coast (0xxx-2xxx)
		if (zipNum < 30000) {
			latitude = 40.0 + (zipNum / 10000) * 5;
			longitude = -75.0 - (zipNum / 10000) * 10;
		}
		// South (3xxx-4xxx)
		else if (zipNum < 50000) {
			latitude = 35.0 + (zipNum / 10000) * 5;
			longitude = -85.0 - (zipNum / 10000) * 5;
		}
		// Midwest (5xxx-6xxx)
		else if (zipNum < 70000) {
			latitude = 40.0 + (zipNum / 10000) * 5;
			longitude = -90.0 - (zipNum / 10000) * 5;
		}
		// Mountain/West (8xxx-9xxx)
		else if (zipNum >= 80000) {
			latitude = 38.0 + (zipNum / 10000) * 3;
			longitude = -105.0 - (zipNum / 10000) * 5;
		}
		// West Coast (9xxx)
		else if (zipNum >= 90000) {
			latitude = 34.0 + (zipNum / 10000) * 2;
			longitude = -118.0 - (zipNum / 10000) * 2;
		}
		
		return { latitude, longitude };
	}

	try {
		const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(zipCode)}&key=${apiKey}&limit=1`;
		const response = await fetch(url);
		
		if (!response.ok) {
			throw new Error(`Geocoding API error: ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if (!data.results || data.results.length === 0) {
			throw new Error("No results found for ZIP code");
		}
		
		const result = data.results[0];
		return {
			latitude: result.geometry.lat,
			longitude: result.geometry.lng,
		};
	} catch (error) {
		console.error("Geocoding error:", error);
		// Fallback to rough estimation
		const zipNum = parseInt(zipCode, 10);
		const latitude = 39.0 + (zipNum / 100000) * 10;
		const longitude = -98.0 - (zipNum / 100000) * 20;
		
		return { latitude, longitude };
	}
}

/**
 * Fetch climate data for a ZIP code from external sources
 */
export async function fetchClimateDataForZip(
	zipCode: string,
): Promise<ClimateEstimate> {
	// First, try to geocode the ZIP code
	const { latitude, longitude } = await geocodeZipCode(zipCode);
	
	// Estimate design temperatures based on location
	const { summerDesignTemp, winterDesignTemp } = estimateDesignTemperatures(
		latitude,
		longitude,
	);
	
	return {
		summerDesignTemp,
		winterDesignTemp,
		latitude,
		longitude,
	};
}

