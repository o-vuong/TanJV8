export class ApiError<T = unknown> extends Error {
	status: number;
	data: T | null;

	constructor(message: string, status: number, data: T | null = null) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

export interface ApiClientOptions {
	baseUrl?: string;
	getHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
	onResponseError?: (error: ApiError) => void;
}

export interface RequestOptions extends RequestInit {
	params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(
	baseUrl: string,
	path: string,
	params?: RequestOptions["params"],
) {
	// Properly concatenate base URL and path
	const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const fullPath = `${normalizedBase}${normalizedPath}`;
	
	// Build query string if params exist
	if (params) {
		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				searchParams.set(key, String(value));
			}
		});
		const queryString = searchParams.toString();
		return queryString ? `${fullPath}?${queryString}` : fullPath;
	}
	
	return fullPath;
}

async function resolveHeaders(getHeaders?: ApiClientOptions["getHeaders"]) {
	const baseHeaders: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (!getHeaders) {
		return baseHeaders;
	}

	const resolved = await getHeaders();
	return {
		...baseHeaders,
		...resolved,
	};
}

export function createApiClient(options: ApiClientOptions = {}) {
	const baseUrl = options.baseUrl ?? "";

	async function request<T>(
		path: string,
		init: RequestOptions = {},
	): Promise<T> {
		const { params, headers, body, ...rest } = init;
		const url = buildUrl(baseUrl, path, params);
		const mergedHeaders = await resolveHeaders(options.getHeaders);

		const response = await fetch(url, {
			...rest,
			headers: {
				...mergedHeaders,
				...headers,
			},
			body,
		});

		const contentType = response.headers.get("content-type") ?? "";
		const isJson = contentType.includes("application/json");
		const payload = isJson ? await response.json() : await response.text();

		if (!response.ok) {
			const error = new ApiError(
				isJson
					? (payload?.message ?? response.statusText)
					: response.statusText,
				response.status,
				payload,
			);
			options.onResponseError?.(error);
			throw error;
		}

		return payload as T;
	}

	return {
		request,
		get: <T>(path: string, init?: RequestOptions) =>
			request<T>(path, { ...init, method: "GET" }),
		post: <T>(path: string, data?: unknown, init?: RequestOptions) =>
			request<T>(path, {
				...init,
				method: "POST",
				body: data !== undefined ? JSON.stringify(data) : undefined,
			}),
		patch: <T>(path: string, data?: unknown, init?: RequestOptions) =>
			request<T>(path, {
				...init,
				method: "PATCH",
				body: data !== undefined ? JSON.stringify(data) : undefined,
			}),
		put: <T>(path: string, data?: unknown, init?: RequestOptions) =>
			request<T>(path, {
				...init,
				method: "PUT",
				body: data !== undefined ? JSON.stringify(data) : undefined,
			}),
		delete: <T>(path: string, init?: RequestOptions) =>
			request<T>(path, {
				...init,
				method: "DELETE",
			}),
	};
}
