import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RegisterForm } from "../../components/auth/RegisterForm";
import { useSession } from "../../lib/auth/client";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const { data: session } = useSession();
	const navigate = useNavigate();

	useEffect(() => {
		if (session?.user) {
			navigate({ to: "/" });
		}
	}, [session, navigate]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-xl">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
						<p className="text-gray-400">
							Sign up to start saving and organizing your calculations
						</p>
					</div>
					<RegisterForm />
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-400">
							Already have an account?{" "}
							<a
								href="/auth/login"
								className="text-blue-400 hover:text-blue-300 font-medium"
							>
								Sign in
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}


