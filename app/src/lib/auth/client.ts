import { createAuthClient } from "better-auth/client";
import { anonymousClient } from "better-auth/client/plugins";

// Get base URL - use absolute URL for SSR, relative for client
function getBaseURL(): string {
	// In SSR, we need an absolute URL
	if (typeof window === "undefined") {
										  // Try to get from environment variable first
										  // In server context, we can access process.env
		const envUrl =
			(typeof process !== "undefined" && process.env?.BETTER_AUTH_URL) ||
			import.meta.env?.BETTER_AUTH_URL ||
			import.meta.env?.VITE_BETTER_AUTH_URL;

		if (envUrl) {
			// Ensure it includes /api/auth
			return envUrl.includes("/api/auth") ? envUrl : `${envUrl}/api/auth`;
		}
		// Fallback to localhost for development
		const port =
			(typeof process !== "undefined" && process.env?.PORT) ||
			import.meta.env?.VITE_PORT ||
			"3000";
		return `http://localhost:${port}/api/auth`;
	}
	// Client-side: use relative URL
	return "/api/auth";
}

export const authClient = createAuthClient({
	baseURL: getBaseURL(),
	plugins: [anonymousClient()],
});

// SSR-safe useSession wrapper
// Better Auth's useSession only works on client
export function useSession() {
	// During SSR, return a safe default
	if (typeof window === "undefined") {
		return {
			data: null,
			isPending: false,
			error: null,
		};
	}
	
	return authClient.useSession();
}

export const {
	signIn,
	signUp,
	signOut,
	resetPassword,
	linkSocial,
	changeEmail,
	changePassword,
	listSessions,
	revokeSession,
	revokeOtherSessions,
} = authClient;

// Export anonymous session functions if available
export const { createAnonymousSession, linkAnonymousSession } =
	(authClient as any).anonymous || {
		createAnonymousSession: async () => ({ data: null }),
		linkAnonymousSession: async () => ({ data: null }),
	};
