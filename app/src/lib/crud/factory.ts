import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createApiClient } from "../api/client";

interface CrudFactoryOptions<_TData, TCreate, TUpdate> {
	resource: string;
	client?: ReturnType<typeof createApiClient>;
	queryKeyBase?: unknown[];
	mapListParams?: (
		params?: Record<string, unknown>,
	) => Record<string, string | number | boolean | undefined>;
	mapCreateData?: (data: TCreate) => unknown;
	mapUpdateData?: (data: TUpdate) => unknown;
}

export function createCRUDHooks<
	TData extends { id: string },
	TCreate = Partial<TData>,
	TUpdate = Partial<TData>,
>(options: CrudFactoryOptions<TData, TCreate, TUpdate>) {
	const {
		resource,
		client = createApiClient({ baseUrl: "/api/" }),
		queryKeyBase = ["crud", resource],
		mapListParams,
		mapCreateData,
		mapUpdateData,
	} = options;

	const listKey = (params?: Record<string, unknown>) =>
		[...queryKeyBase, "list", params ?? {}] satisfies unknown[];

	const detailKey = (id: string) =>
		[...queryKeyBase, "detail", id] satisfies unknown[];

	const basePath = resource.endsWith("/") ? resource : `${resource}`;

	function useList(
		params?: Record<string, unknown>,
		queryOptions?: UseQueryOptions<TData[], Error>,
	) {
		return useQuery<TData[], Error>({
			queryKey: listKey(params),
			queryFn: () =>
				client.get<TData[]>(`${basePath}`, {
					params: mapListParams ? mapListParams(params) : params,
				}),
			...queryOptions,
		});
	}

	function useGet(
		id: string | undefined,
		queryOptions?: UseQueryOptions<TData, Error>,
	) {
		return useQuery<TData, Error>({
			queryKey: id ? detailKey(id) : [],
			queryFn: async () => {
				if (!id) {
					throw new Error("Entity id is required");
				}
				return client.get<TData>(`${basePath}/${id}`);
			},
			enabled: Boolean(id) && (queryOptions?.enabled ?? true),
			...queryOptions,
		});
	}

	function useCreate(
		mutationOptions?: UseMutationOptions<TData, Error, TCreate>,
	) {
		const queryClient = useQueryClient();
		return useMutation<TData, Error, TCreate>({
			mutationFn: (payload) =>
				client.post<TData>(
					`${basePath}`,
					mapCreateData ? mapCreateData(payload) : payload,
				),
			onSuccess: (data, ...args) => {
				queryClient.invalidateQueries({ queryKey: queryKeyBase });
				queryClient.setQueryData(detailKey(data.id), data);
				mutationOptions?.onSuccess?.(data, ...args);
			},
			...mutationOptions,
		});
	}

	function useUpdate(
		mutationOptions?: UseMutationOptions<
			TData,
			Error,
			{ id: string; data: TUpdate }
		>,
	) {
		const queryClient = useQueryClient();
		return useMutation<TData, Error, { id: string; data: TUpdate }>({
			mutationFn: ({ id, data }) =>
				client.patch<TData>(
					`${basePath}/${id}`,
					mapUpdateData ? mapUpdateData(data) : data,
				),
			onSuccess: (data, variables, ...args) => {
				queryClient.invalidateQueries({ queryKey: listKey(undefined) });
				queryClient.setQueryData(detailKey(variables.id), data);
				mutationOptions?.onSuccess?.(data, variables, ...args);
			},
			...mutationOptions,
		});
	}

	function useDelete(
		mutationOptions?: UseMutationOptions<void, Error, string>,
	) {
		const queryClient = useQueryClient();
		return useMutation<void, Error, string>({
			mutationFn: (id) => client.delete<void>(`${basePath}/${id}`),
			onSuccess: (_data, id, ...args) => {
				queryClient.invalidateQueries({ queryKey: queryKeyBase });
				queryClient.removeQueries({ queryKey: detailKey(id) });
				mutationOptions?.onSuccess?.(_data, id, ...args);
			},
			...mutationOptions,
		});
	}

	return {
		useList,
		useGet,
		useCreate,
		useUpdate,
		useDelete,
		listKey,
		detailKey,
	};
}
