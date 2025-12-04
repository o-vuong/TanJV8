import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { signIn } from "../../lib/auth/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { getErrorMessage } from "../calculator/form-utils";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/login", strict: false });
  const redirectTo = (search as { redirectTo?: string })?.redirectTo || "/";

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validatorAdapter: zodValidator,
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await signIn.email({
          email: value.email,
          password: value.password,
        });
        if (result.error) {
          setError(result.error.message);
        } else {
          // Migration will be handled by MigrationHandler component
          // Redirect after successful login
          navigate({ to: redirectTo });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign in failed");
      } finally {
        setIsSubmitting(false);
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
      <form.Field name="email" validators={{ onChange: schema.shape.email }}>
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
            />
            {field.state.meta.errors?.[0] && (
              <p className="text-sm text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

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
              autoComplete="current-password"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
            />
            {field.state.meta.errors?.[0] && (
              <p className="text-sm text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {error && (
        <div className="flex items-center gap-2 rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
