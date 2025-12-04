/**
 * Security headers for production deployment
 * Implements OWASP best practices for web application security
 */

export interface SecurityHeadersOptions {
	enableCSP?: boolean;
	enableHSTS?: boolean;
	reportOnly?: boolean;
}

/**
 * Get security headers for responses
 */
export function getSecurityHeaders(
	options: SecurityHeadersOptions = {},
): Record<string, string> {
	const {
		enableCSP = true,
		enableHSTS = process.env.NODE_ENV === "production",
		reportOnly = false,
	} = options;

	const headers: Record<string, string> = {
		// Prevent clickjacking attacks
		"X-Frame-Options": "DENY",

		// Prevent MIME type sniffing
		"X-Content-Type-Options": "nosniff",

		// Enable browser XSS protection
		"X-XSS-Protection": "1; mode=block",

		// Control referrer information
		"Referrer-Policy": "strict-origin-when-cross-origin",

		// Permissions policy (formerly Feature-Policy)
		"Permissions-Policy":
			"geolocation=(), microphone=(), camera=(), payment=(), usb=()",
	};

	// Content Security Policy
	if (enableCSP) {
		const cspDirectives = [
			"default-src 'self'",
			// Allow inline scripts and styles (required for React/Vite)
			// In production, consider using nonces or hashes
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https: blob:",
			"font-src 'self' data:",
			"connect-src 'self' https://accelerate.prisma-data.net wss:",
			"media-src 'self'",
			"object-src 'none'",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			"upgrade-insecure-requests",
		];

		const cspHeader = reportOnly
			? "Content-Security-Policy-Report-Only"
			: "Content-Security-Policy";

		headers[cspHeader] = cspDirectives.join("; ");
	}

	// HTTP Strict Transport Security (HSTS)
	if (enableHSTS) {
		headers["Strict-Transport-Security"] =
			"max-age=31536000; includeSubDomains; preload";
	}

	return headers;
}

/**
 * Apply security headers to a Response
 */
export function applySecurityHeaders(
	response: Response,
	options?: SecurityHeadersOptions,
): Response {
	const headers = new Headers(response.headers);
	const securityHeaders = getSecurityHeaders(options);

	for (const [key, value] of Object.entries(securityHeaders)) {
		headers.set(key, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

/**
 * CORS headers for API routes
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
		"http://localhost:3000",
	];

	const isAllowed = origin && allowedOrigins.includes(origin);

	return {
		"Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Max-Age": "86400", // 24 hours
		"Access-Control-Allow-Credentials": "true",
	};
}

/**
 * Cache control headers for different resource types
 */
export const CacheHeaders = {
	/**
	 * No caching - for dynamic content
	 */
	NO_CACHE: {
		"Cache-Control": "no-cache, no-store, must-revalidate",
		Pragma: "no-cache",
		Expires: "0",
	},

	/**
	 * Short cache - for semi-dynamic content (5 minutes)
	 */
	SHORT: {
		"Cache-Control": "public, max-age=300, s-maxage=300",
	},

	/**
	 * Medium cache - for stable content (1 hour)
	 */
	MEDIUM: {
		"Cache-Control": "public, max-age=3600, s-maxage=3600",
	},

	/**
	 * Long cache - for immutable content (1 year)
	 */
	LONG: {
		"Cache-Control": "public, max-age=31536000, immutable",
	},

	/**
	 * Stale-while-revalidate - for content that can be slightly stale
	 */
	SWR: {
		"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
	},
} as const;
