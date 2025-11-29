import type { TemporaryCalculation } from "./temporary";
import {
	getAllTemporaryCalculationsForMigration,
	clearTemporaryData,
} from "./temporary";
import { useCreateGroup, useCreateProject, useGroups } from "../queries/groups";
import { useCreateCalculation } from "../queries/calculations";

/**
 * Migration utility to transfer temporary calculations to database
 * when user logs in
 */

const DEFAULT_GROUP_NAME = "Imported Calculations";
const DEFAULT_PROJECT_PREFIX = "Calculation";

/**
 * Migrate all temporary calculations to the database
 * This should be called after user logs in
 */
export async function migrateTemporaryCalculations(
	createGroup: (input: { name: string }) => Promise<{ id: string }>,
	createProject: (input: {
		name: string;
		description?: string;
		groupId: string;
	}) => Promise<{ id: string }>,
	createCalculation: (input: {
		projectId: string;
		inputs: unknown;
		results: unknown;
	}) => Promise<void>,
	getGroups: () => Promise<Array<{ id: string; name: string }>>,
): Promise<{ migrated: number; errors: number }> {
	const calculations = getAllTemporaryCalculationsForMigration();
	
	if (calculations.length === 0) {
		return { migrated: 0, errors: 0 };
	}

	let migrated = 0;
	let errors = 0;

	try {
		// Get or create default group
		const groups = await getGroups();
		let defaultGroup = groups.find((g) => g.name === DEFAULT_GROUP_NAME);

		if (!defaultGroup) {
			const newGroup = await createGroup({ name: DEFAULT_GROUP_NAME });
			defaultGroup = { id: newGroup.id, name: DEFAULT_GROUP_NAME };
		}

		// Migrate each calculation
		for (const calc of calculations) {
			try {
				// Create a project for this calculation
				const project = await createProject({
					name: calc.name || `${DEFAULT_PROJECT_PREFIX} ${new Date(calc.createdAt).toLocaleDateString()}`,
					description: `Migrated from temporary session on ${new Date(calc.createdAt).toLocaleString()}`,
					groupId: defaultGroup.id,
				});

				// Save the calculation
				await createCalculation({
					projectId: project.id,
					inputs: calc.inputs as Record<string, unknown>,
					results: calc.results as Record<string, unknown>,
				});

				migrated++;
			} catch (error) {
				console.error(`Failed to migrate calculation ${calc.id}:`, error);
				errors++;
			}
		}

		// Clear temporary data after successful migration
		if (migrated > 0) {
			clearTemporaryData();
		}
	} catch (error) {
		console.error("Failed to migrate temporary calculations:", error);
		errors += calculations.length - migrated;
	}

	return { migrated, errors };
}

/**
 * Hook to migrate temporary calculations when user logs in
 * This should be used in a component that has access to the session
 */
export function useMigrateTemporaryCalculations() {
	const { data: groups, refetch: refetchGroups } = useGroups();
	const createGroup = useCreateGroup();
	const createProject = useCreateProject();
	const createCalculation = useCreateCalculation();

	const migrate = async (): Promise<{ migrated: number; errors: number }> => {
		// Ensure groups are loaded
		let currentGroups = groups;
		if (!currentGroups) {
			const result = await refetchGroups();
			currentGroups = result.data;
		}

		if (!currentGroups) {
			return { migrated: 0, errors: 0 };
		}

		return migrateTemporaryCalculations(
			async (input) => {
				const result = await createGroup.mutateAsync(input);
				// Refetch groups after creating
				await refetchGroups();
				return result;
			},
			async (input) => {
				const result = await createProject.mutateAsync(input);
				return result;
			},
			async (input) => {
				await createCalculation.mutateAsync(input);
			},
			async () => {
				const result = await refetchGroups();
				return result.data || [];
			},
		);
	};

	return {
		migrate,
		isMigrating:
			createGroup.isPending || createProject.isPending || createCalculation.isPending,
	};
}

