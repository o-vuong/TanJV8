import { useMutation, useQueryClient } from "@tanstack/react-query";
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

// Archive mutation hook
export function useArchiveCalculation() {
	const queryClient = useQueryClient();
	
	return useMutation<CalculationRecord, Error, string>({
		mutationFn: async (id: string) => {
			return apiClient.post<CalculationRecord>(`/${id}`, {});
		},
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ["calculations"] });
			queryClient.removeQueries({ queryKey: calculationDetailKey(id) });
		},
	});
}
