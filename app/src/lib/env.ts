import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	DATABASE_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	SENTRY_DSN: z.string().url().optional(),
	LOGROCKET_APP_ID: z.string().optional(),
	LHCI_GITHUB_APP_TOKEN: z.string().optional(),
	PERCY_TOKEN: z.string().optional(),
	ENABLE_OAUTH: z.coerce.boolean().optional(),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	GITHUB_CLIENT_ID: z.string().optional(),
	GITHUB_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse({
	NODE_ENV: process.env.NODE_ENV,
	DATABASE_URL: process.env.DATABASE_URL,
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
	BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
	SENTRY_DSN: process.env.SENTRY_DSN,
	LOGROCKET_APP_ID: process.env.LOGROCKET_APP_ID,
	LHCI_GITHUB_APP_TOKEN: process.env.LHCI_GITHUB_APP_TOKEN,
	PERCY_TOKEN: process.env.PERCY_TOKEN,
	ENABLE_OAUTH: process.env.ENABLE_OAUTH,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
});

if (!parsed.success) {
	console.error(
		"❌ Invalid environment variables",
		parsed.error.flatten().fieldErrors,
	);
	throw new Error("Invalid environment variables");
}

export const env = parsed.data;
