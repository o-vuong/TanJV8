import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { signUp } from "../../lib/auth/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const schema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.string().email("Enter a valid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
		termsAccepted: z.literal(true, {
			errorMap: () => ({ message: "You must accept the terms" }),
		}),
	})
	.refine((value) => value.password === value.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords do not match",
	});

export function RegisterForm() {
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [message, setMessage] = useState<string>("");

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			termsAccepted: false,
		},
		validatorAdapter: zodValidator,
		onSubmit: async ({ value }) => {
			setStatus("idle");
			setMessage("");
			try {
				const result = await signUp.email({
					name: value.name,
					email: value.email,
					password: value.password,
				});
				if (result.error) {
					setStatus("error");
					setMessage(result.error.message);
					return;
				}
				setStatus("success");
				setMessage("Check your inbox to verify your email address.");
			} catch (err) {
				setStatus("error");
				setMessage(err instanceof Error ? err.message : "Registration failed");
			}
		},
	});

	return (
		<form
			className="space-y-6"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="name" validators={{ onChange: schema.shape.name }}>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Full Name</Label>
						<Input
							id={field.name}
							value={field.state.value}
							onChange={(event) => field.handleChange(event.target.value)}
							onBlur={field.handleBlur}
							autoComplete="name"
						/>
						{field.state.meta.errors?.[0] && (
							<p className="text-sm text-destructive">
								{typeof field.state.meta.errors[0] === 'string'
									? field.state.meta.errors[0]
									: (field.state.meta.errors[0] as any)?.message || 'Invalid input'}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field name="email" validators={{ onChange: schema.shape.email }}>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Email</Label>
						<Input
							id={field.name}
							type="email"
							value={field.state.value}
							onChange={(event) => field.handleChange(event.target.value)}
							onBlur={field.handleBlur}
							autoComplete="email"
						/>
						{field.state.meta.errors?.[0] && (
							<p className="text-sm text-destructive">
								{typeof field.state.meta.errors[0] === 'string'
									? field.state.meta.errors[0]
									: (field.state.meta.errors[0] as any)?.message || 'Invalid input'}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field
					name="password"
					validators={{ onChange: schema.shape.password }}
				>
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Password</Label>
							<Input
								id={field.name}
								type="password"
								value={field.state.value}
								onChange={(event) => field.handleChange(event.target.value)}
								onBlur={field.handleBlur}
								autoComplete="new-password"
							/>
							{field.state.meta.errors?.[0] && (
								<p className="text-sm text-destructive">
									{field.state.meta.errors[0]}
								</p>
							)}
						</div>
					)}
				</form.Field>

				<form.Field
					name="confirmPassword"
					validators={{ onChange: schema.shape.confirmPassword }}
				>
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Confirm Password</Label>
							<Input
								id={field.name}
								type="password"
								value={field.state.value}
								onChange={(event) => field.handleChange(event.target.value)}
								onBlur={field.handleBlur}
								autoComplete="new-password"
							/>
							{field.state.meta.errors?.[0] && (
								<p className="text-sm text-destructive">
									{field.state.meta.errors[0]}
								</p>
							)}
						</div>
					)}
				</form.Field>
			</div>

			<form.Field
				name="termsAccepted"
				validators={{ onChange: schema.shape.termsAccepted }}
			>
				{(field) => (
					<label className="flex items-center gap-3 text-sm">
						<input
							type="checkbox"
							checked={field.state.value}
							onChange={(event) => field.handleChange(event.target.checked)}
						/>
						<span>
							I agree to the{" "}
							<a className="underline" href="/legal/terms">
								Terms of Service
							</a>{" "}
							and{" "}
							<a className="underline" href="/legal/privacy">
								Privacy Policy
							</a>
						</span>
					</label>
				)}
			</form.Field>

			{status !== "idle" && (
				<div
					className={`flex items-center gap-2 rounded px-4 py-3 text-sm ${
						status === "success"
							? "border border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
							: "border border-destructive/50 bg-destructive/10 text-destructive"
					}`}
				>
					{status === "success" ? (
						<CheckCircle className="h-4 w-4" />
					) : (
						<AlertCircle className="h-4 w-4" />
					)}
					<span>{message}</span>
				</div>
			)}

			<Button type="submit" className="w-full">
				Create account
			</Button>
		</form>
	);
}
