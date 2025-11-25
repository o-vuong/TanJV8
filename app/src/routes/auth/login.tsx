import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { LoginForm } from "../../components/auth/LoginForm";
import { useSession } from "../../lib/auth/client";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			redirectTo: (search.redirectTo as string) || "/",
		};
	},
});

function LoginPage() {
	const { data: session } = useSession();
	const navigate = useNavigate();
	const { redirectTo } = useSearch({ from: "/auth/login" });

	useEffect(() => {
		if (session?.user) {
			navigate({ to: redirectTo });
		}
	}, [session, navigate, redirectTo]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-xl">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
						<p className="text-gray-400">
							Sign in to save and organize your calculations
						</p>
					</div>
					<LoginForm />
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-400">
							Don't have an account?{" "}
							<a
								href="/auth/register"
								className="text-blue-400 hover:text-blue-300 font-medium"
							>
								Sign up
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

