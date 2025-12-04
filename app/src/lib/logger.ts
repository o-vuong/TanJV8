/**
 * Structured logging with Pino
 * Provides consistent logging across the application
 */

import pino from "pino";

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || "info";
const isDevelopment = process.env.NODE_ENV === "development";

// Configure pino logger
export const logger = pino({
	level: logLevel,
	// Use pino-pretty in development for readable logs
	transport: isDevelopment
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
			}
		: undefined,
	// Add default fields
	base: {
		env: process.env.NODE_ENV,
	},
	// Serialize errors properly
	serializers: {
		err: pino.stdSerializers.err,
		error: pino.stdSerializers.err,
		req: pino.stdSerializers.req,
		res: pino.stdSerializers.res,
	},
	// Redact sensitive information
	redact: {
		paths: [
			"password",
			"*.password",
			"*.token",
			"*.apiKey",
			"*.secret",
			"authorization",
			"cookie",
		],
		remove: true,
	},
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
	return logger.child(context);
}

/**
 * Log levels:
 * - fatal (60): The service/app is going to stop or become unusable
 * - error (50): Fatal for a particular request, but the service/app continues
 * - warn (40): A note on something that should probably be looked at
 * - info (30): Detail on regular operation
 * - debug (20): Anything else, i.e. too verbose to be included in "info" level
 * - trace (10): Logging from external libraries or very detailed application logging
 */

/**
 * Example usage:
 *
 * logger.info({ userId: '123', action: 'login' }, 'User logged in');
 * logger.error({ err: error, userId: '123' }, 'Failed to process request');
 * logger.debug({ query: sqlQuery }, 'Executing database query');
 *
 * // With child logger
 * const requestLogger = createLogger({ requestId: 'abc-123' });
 * requestLogger.info('Processing request');
 */
