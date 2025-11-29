import type { ManualJInputs, ManualJResults } from "@manualj/calc-engine";
import type { ClimateData } from "../queries/location";

const STORAGE_KEY_PREFIX = "manualj_temp_";
const KEYS = {
	CALCULATIONS: `${STORAGE_KEY_PREFIX}calculations`,
	CURRENT_CLIMATE: `${STORAGE_KEY_PREFIX}current_climate`,
	CURRENT_INPUTS: `${STORAGE_KEY_PREFIX}current_inputs`,
	CURRENT_RESULTS: `${STORAGE_KEY_PREFIX}current_results`,
	FORM_STATE: `${STORAGE_KEY_PREFIX}form`,
} as const;

/**
 * Temporary storage utility for unauthenticated users.
 * Data is stored in sessionStorage and cleared when:
 * - User logs in (after migration)
 * - Session ends (browser tab closes)
 * - Explicitly cleared
 */

export interface TemporaryCalculation {
	id: string;
	name?: string;
	climateData: ClimateData;
	inputs: ManualJInputs;
	results: ManualJResults;
	createdAt: string;
}

export interface TemporaryFormState {
	[key: string]: unknown;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
	return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

/**
 * Get all temporary calculations
 */
export function getTemporaryCalculations(): TemporaryCalculation[] {
	if (!isBrowser()) return [];
	try {
		const data = sessionStorage.getItem(KEYS.CALCULATIONS);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.warn("Failed to load temporary calculations:", error);
		return [];
	}
}

/**
 * Add a new calculation to temporary storage
 */
export function addTemporaryCalculation(
	climateData: ClimateData,
	inputs: ManualJInputs,
	results: ManualJResults,
	name?: string,
): string {
	if (!isBrowser()) return "";
	try {
		const calculations = getTemporaryCalculations();
		const id = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		const newCalculation: TemporaryCalculation = {
			id,
			name: name || `Calculation ${calculations.length + 1}`,
			climateData,
			inputs,
			results,
			createdAt: new Date().toISOString(),
		};
		calculations.push(newCalculation);
		sessionStorage.setItem(KEYS.CALCULATIONS, JSON.stringify(calculations));
		return id;
	} catch (error) {
		console.warn("Failed to save temporary calculation:", error);
		return "";
	}
}

/**
 * Remove a calculation from temporary storage
 */
export function removeTemporaryCalculation(id: string): void {
	if (!isBrowser()) return;
	try {
		const calculations = getTemporaryCalculations();
		const filtered = calculations.filter((calc) => calc.id !== id);
		sessionStorage.setItem(KEYS.CALCULATIONS, JSON.stringify(filtered));
	} catch (error) {
		console.warn("Failed to remove temporary calculation:", error);
	}
}

/**
 * Get count of temporary calculations
 */
export function getTemporaryCalculationsCount(): number {
	return getTemporaryCalculations().length;
}

/**
 * Save current calculation being worked on (before it's completed)
 */
export function saveCurrentCalculation(
	climateData: ClimateData | null,
	inputs: ManualJInputs | null,
	results: ManualJResults | null,
): void {
	if (!isBrowser()) return;
	try {
		if (climateData) {
			sessionStorage.setItem(KEYS.CURRENT_CLIMATE, JSON.stringify(climateData));
		} else {
			sessionStorage.removeItem(KEYS.CURRENT_CLIMATE);
		}
		if (inputs) {
			sessionStorage.setItem(KEYS.CURRENT_INPUTS, JSON.stringify(inputs));
		} else {
			sessionStorage.removeItem(KEYS.CURRENT_INPUTS);
		}
		if (results) {
			sessionStorage.setItem(KEYS.CURRENT_RESULTS, JSON.stringify(results));
		} else {
			sessionStorage.removeItem(KEYS.CURRENT_RESULTS);
		}
	} catch (error) {
		console.warn("Failed to save current calculation:", error);
	}
}

/**
 * Load current calculation being worked on
 */
export function loadCurrentCalculation(): {
	climateData: ClimateData | null;
	inputs: ManualJInputs | null;
	results: ManualJResults | null;
} {
	if (!isBrowser()) {
		return { climateData: null, inputs: null, results: null };
	}
	try {
		const climateData = sessionStorage.getItem(KEYS.CURRENT_CLIMATE);
		const inputs = sessionStorage.getItem(KEYS.CURRENT_INPUTS);
		const results = sessionStorage.getItem(KEYS.CURRENT_RESULTS);
		return {
			climateData: climateData ? JSON.parse(climateData) : null,
			inputs: inputs ? JSON.parse(inputs) : null,
			results: results ? JSON.parse(results) : null,
		};
	} catch (error) {
		console.warn("Failed to load current calculation:", error);
		return { climateData: null, inputs: null, results: null };
	}
}

/**
 * Save form state to temporary storage
 */
export function saveTemporaryFormState(state: TemporaryFormState): void {
	if (!isBrowser()) return;
	try {
		sessionStorage.setItem(KEYS.FORM_STATE, JSON.stringify(state));
	} catch (error) {
		console.warn("Failed to save temporary form state:", error);
	}
}

/**
 * Load form state from temporary storage
 */
export function loadTemporaryFormState(): TemporaryFormState | null {
	if (!isBrowser()) return null;
	try {
		const data = sessionStorage.getItem(KEYS.FORM_STATE);
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.warn("Failed to load temporary form state:", error);
		return null;
	}
}

/**
 * Clear all temporary calculation data
 */
export function clearTemporaryData(): void {
	if (!isBrowser()) return;
	try {
		Object.values(KEYS).forEach((key) => {
			sessionStorage.removeItem(key);
		});
	} catch (error) {
		console.warn("Failed to clear temporary data:", error);
	}
}

/**
 * Check if any temporary data exists
 */
export function hasTemporaryData(): boolean {
	if (!isBrowser()) return false;
	return (
		getTemporaryCalculationsCount() > 0 ||
		Object.values(KEYS)
			.filter((key) => key !== KEYS.CALCULATIONS)
			.some((key) => sessionStorage.getItem(key) !== null)
	);
}

/**
 * Get all temporary calculations for migration
 */
export function getAllTemporaryCalculationsForMigration(): TemporaryCalculation[] {
	return getTemporaryCalculations();
}
