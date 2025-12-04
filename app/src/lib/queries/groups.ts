import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient } from "../api/client";

const apiClient = createApiClient({ baseUrl: "/api" });

export interface Group {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	projects: Project[];
}

export interface Project {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	calculationCount?: number;
	calculations?: Calculation[];
}

export interface Calculation {
	id: string;
	version: number;
	createdAt: string;
	inputs: unknown;
	results: unknown;
}

export interface CreateGroupInput {
	name: string;
}

export interface CreateProjectInput {
	name: string;
	description?: string;
	groupId: string;
}

// Query hooks for groups
export function useGroups() {
	return useQuery<Group[]>({
		queryKey: ["groups"],
		queryFn: async () => {
			const data = await apiClient.get<Group[]>("/groups");
			return data;
		},
		staleTime: 30 * 1000, // 30 seconds
	});
}

export function useCreateGroup() {
	const queryClient = useQueryClient();
	return useMutation<Group, Error, CreateGroupInput>({
		mutationFn: async (input) => {
			return apiClient.post<Group>("/groups", input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["groups"] });
		},
	});
}

// Query hooks for projects
export function useProjects(groupId: string | undefined) {
	return useQuery<Project[]>({
		queryKey: ["projects", groupId],
		queryFn: async () => {
			if (!groupId) {
				throw new Error("Group ID is required");
			}
			const data = await apiClient.get<Project[]>("/projects", {
				params: { groupId },
			});
			return data;
		},
		enabled: Boolean(groupId),
		staleTime: 30 * 1000, // 30 seconds
	});
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	return useMutation<Project, Error, CreateProjectInput>({
		mutationFn: async (input) => {
			return apiClient.post<Project>("/projects", input);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["groups"] });
			queryClient.invalidateQueries({ queryKey: ["projects", data.groupId] });
		},
	});
}


