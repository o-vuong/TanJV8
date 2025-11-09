import type { Session } from "./auth";
import { auth } from "./auth";

export async function requireAuth(request: Request): Promise<Session> {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		throw new Response("Unauthorized", { status: 401 });
	}

	return session;
}

export async function optionalAuth(request: Request): Promise<Session | null> {
	return auth.api.getSession({ headers: request.headers });
}
