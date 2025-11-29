import { useSyncExternalStore } from "react";
import { createAuthClient } from "better-auth/client";
import { anonymousClient } from "better-auth/client/plugins";

// Get base URL - always use absolute URL for Better Auth
function getBaseURL(): string {
	// Try to get from environment variable first
	const envUrl =
		(typeof process !== "undefined" && process.env?.BETTER_AUTH_URL) ||
		import.meta.env?.BETTER_AUTH_URL ||
		import.meta.env?.VITE_BETTER_AUTH_URL;

	if (envUrl) {
		// Ensure it includes /api/auth
		return envUrl.includes("/api/auth") ? envUrl : `${envUrl}/api/auth`;
	}
	
	// Fallback: use window.location for client, or localhost for SSR
	if (typeof window !== "undefined") {
		const origin = window.location.origin;
		return `${origin}/api/auth`;
	}
	
	// SSR fallback to localhost
	const port =
		(typeof process !== "undefined" && process.env?.PORT) ||
		import.meta.env?.VITE_PORT ||
		"3000";
	return `http://localhost:${port}/api/auth`;
}

export const authClient = createAuthClient({
	baseURL: getBaseURL(),
	plugins: [anonymousClient()],
});

// Export useSession hook - Better Auth exports it as a store/atom
// We need to wrap it in a React hook using useSyncExternalStore
export function useSession() {
	// During SSR, return safe defaults
	if (typeof window === "undefined") {
		return {
			data: null,
			isPending: true,
			error: null,
		};
	}
	
	// Use React's useSyncExternalStore to subscribe to Better Auth's session store
	const sessionStore = authClient.useSession;
	
	return useSyncExternalStore(
		(listener) => {
			// Subscribe to the store
			if (sessionStore && typeof sessionStore.subscribe === "function") {
				return sessionStore.subscribe(listener);
			}
			return () => {};
		},
		() => {
			// Get the current value
			if (sessionStore && typeof sessionStore.get === "function") {
				return sessionStore.get();
			}
			return { data: null, isPending: false, error: null };
		},
		() => {
			// Server snapshot
			return { data: null, isPending: true, error: null };
		}
	);
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
