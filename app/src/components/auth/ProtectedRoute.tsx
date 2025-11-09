import { useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { useSession } from "../../lib/auth/client";

interface ProtectedRouteProps {
	children: ReactNode;
	requireAuth?: boolean;
	requiredRole?: "USER" | "ADMIN" | "SUPER_ADMIN";
	fallback?: ReactNode;
}

const ROLE_ORDER: Array<"USER" | "ADMIN" | "SUPER_ADMIN"> = [
	"USER",
	"ADMIN",
	"SUPER_ADMIN",
];

export function ProtectedRoute({
	children,
	requireAuth = true,
	requiredRole,
	fallback,
}: ProtectedRouteProps) {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (isPending) return;

		if (requireAuth && !session?.user) {
			const returnTo = encodeURIComponent(
				window.location.pathname + window.location.search,
			);
			router.navigate({ to: `/auth/login?redirectTo=${returnTo}` });
			return;
		}

		if (requiredRole && session?.user) {
			const userRoleIndex = ROLE_ORDER.indexOf(
				session.user.role as (typeof ROLE_ORDER)[number],
			);
			const requiredRoleIndex = ROLE_ORDER.indexOf(requiredRole);
			if (userRoleIndex < requiredRoleIndex) {
				router.navigate({ to: "/unauthorized" });
			}
		}
	}, [isPending, requireAuth, requiredRole, router, session?.user]);

	if (isPending) {
		return (
			fallback ?? (
				<div className="py-6 text-center text-sm text-muted-foreground">
					Loading…
				</div>
			)
		);
	}

	if (requireAuth && !session?.user) {
		return fallback ?? null;
	}

	if (requiredRole && session?.user) {
		const userRoleIndex = ROLE_ORDER.indexOf(
			session.user.role as (typeof ROLE_ORDER)[number],
		);
		const requiredRoleIndex = ROLE_ORDER.indexOf(requiredRole);
		if (userRoleIndex < requiredRoleIndex) {
			return fallback ?? null;
		}
	}

	return <>{children}</>;
}
