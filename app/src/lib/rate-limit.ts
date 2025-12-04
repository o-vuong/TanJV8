/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or a dedicated rate limiting service
 */

import { RateLimitError } from "./errors";

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

// In-memory store (consider Redis for production with multiple instances)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store.entries()) {
		if (entry.resetTime < now) {
			store.delete(key);
		}
	}
}, 5 * 60 * 1000);

/**
 * Rate limit middleware
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig,
): void {
	const now = Date.now();
	const entry = store.get(identifier);

	// If no entry or expired, create new
	if (!entry || entry.resetTime < now) {
		store.set(identifier, {
			count: 1,
			resetTime: now + config.windowMs,
		});
		return;
	}

	// Increment count
	entry.count++;

	// Check if limit exceeded
	if (entry.count > config.maxRequests) {
		const resetIn = Math.ceil((entry.resetTime - now) / 1000);
		throw new RateLimitError(
			`Rate limit exceeded. Try again in ${resetIn} seconds`,
		);
	}
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
	identifier: string,
	config: RateLimitConfig,
): Record<string, string> {
	const entry = store.get(identifier);
	const now = Date.now();

	if (!entry || entry.resetTime < now) {
		return {
			"X-RateLimit-Limit": String(config.maxRequests),
			"X-RateLimit-Remaining": String(config.maxRequests),
			"X-RateLimit-Reset": String(Math.ceil((now + config.windowMs) / 1000)),
		};
	}

	const remaining = Math.max(0, config.maxRequests - entry.count);
	const reset = Math.ceil(entry.resetTime / 1000);

	return {
		"X-RateLimit-Limit": String(config.maxRequests),
		"X-RateLimit-Remaining": String(remaining),
		"X-RateLimit-Reset": String(reset),
	};
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
	// Strict: 10 requests per minute
	STRICT: {
		windowMs: 60 * 1000,
		maxRequests: 10,
	},
	// Standard: 100 requests per 15 minutes
	STANDARD: {
		windowMs: 15 * 60 * 1000,
		maxRequests: 100,
	},
	// Generous: 1000 requests per hour
	GENEROUS: {
		windowMs: 60 * 60 * 1000,
		maxRequests: 1000,
	},
	// Auth: 5 login attempts per 15 minutes
	AUTH: {
		windowMs: 15 * 60 * 1000,
		maxRequests: 5,
	},
} as const;

/**
 * Extract client identifier from request
 */
export function getClientIdentifier(request: Request): string {
	// Try to get real IP from headers (adjust based on your proxy setup)
	const forwardedFor = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");
	const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

	const ip =
		cfConnectingIp || realIp || forwardedFor?.split(",")[0] || "unknown";

	return ip.trim();
}
