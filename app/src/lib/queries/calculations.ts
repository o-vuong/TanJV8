import { createApiClient } from "../api/client";
import { createCRUDHooks } from "../crud/factory";

export interface CalculationInputEnvelope {
	projectId: string;
	inputs: unknown;
	results?: unknown;
}

export interface CalculationRecord {
	id: string;
	projectId: string;
	version: number;
	inputs: unknown;
	results: unknown;
	createdAt: string;
	updatedAt: string;
}

const apiClient = createApiClient({ baseUrl: "/api/calculations" });

export const calculationCrud = createCRUDHooks<
	CalculationRecord,
	CalculationInputEnvelope,
	Partial<CalculationInputEnvelope>
>({
	resource: "",
	client: apiClient,
	queryKeyBase: ["calculations"],
});

export const {
	useList: useCalculations,
	useGet: useCalculation,
	useCreate: useCreateCalculation,
	useUpdate: useUpdateCalculation,
	useDelete: useDeleteCalculation,
	listKey: calculationListKey,
	detailKey: calculationDetailKey,
} = calculationCrud;
