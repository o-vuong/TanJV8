/**
 * Health check endpoint for monitoring and load balancers
 * Returns application health status and basic metrics
 */

import type { APIEvent } from "@tanstack/react-start/server";
import { db } from "~/db";

interface HealthCheckResponse {
	status: "healthy" | "unhealthy" | "degraded";
	timestamp: string;
	uptime: number;
	checks: {
		database: {
			status: "up" | "down";
			responseTime?: number;
		};
	};
	version?: string;
}

export async function GET({ request }: APIEvent): Promise<Response> {
	const startTime = Date.now();
	const checks: HealthCheckResponse["checks"] = {
		database: { status: "down" },
	};

	// Check database connectivity
	try {
		const dbStart = Date.now();
		await db.$queryRaw`SELECT 1 as health_check`;
		checks.database = {
			status: "up",
			responseTime: Date.now() - dbStart,
		};
	} catch (error) {
		checks.database = { status: "down" };
		console.error("Health check: Database connection failed", error);
	}

	// Determine overall health status
	const isHealthy = checks.database.status === "up";
	const status: HealthCheckResponse["status"] = isHealthy
		? "healthy"
		: "unhealthy";

	const response: HealthCheckResponse = {
		status,
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		checks,
		version: process.env.npm_package_version,
	};

	// Return appropriate status code
	const statusCode = isHealthy ? 200 : 503;

	return new Response(JSON.stringify(response, null, 2), {
		status: statusCode,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache, no-store, must-revalidate",
		},
	});
}
