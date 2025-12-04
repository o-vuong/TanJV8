/**
 * Standardized error classes for the application
 * Provides consistent error handling across the codebase
 */

export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public code: string = "INTERNAL_ERROR",
	) {
		super(message);
		this.name = "AppError";
		Error.captureStackTrace(this, this.constructor);
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			statusCode: this.statusCode,
			code: this.code,
		};
	}
}

export class ValidationError extends AppError {
	constructor(message: string, public details?: unknown) {
		super(message, 400, "VALIDATION_ERROR");
		this.name = "ValidationError";
	}

	toJSON() {
		return {
			...super.toJSON(),
			details: this.details,
		};
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401, "UNAUTHORIZED");
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, 403, "FORBIDDEN");
		this.name = "ForbiddenError";
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, 404, "NOT_FOUND");
		this.name = "NotFoundError";
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409, "CONFLICT");
		this.name = "ConflictError";
	}
}

export class RateLimitError extends AppError {
	constructor(message = "Too many requests") {
		super(message, 429, "RATE_LIMIT_EXCEEDED");
		this.name = "RateLimitError";
	}
}

export class DatabaseError extends AppError {
	constructor(message: string, public originalError?: Error) {
		super(message, 500, "DATABASE_ERROR");
		this.name = "DatabaseError";
	}

	toJSON() {
		return {
			...super.toJSON(),
			originalError: this.originalError?.message,
		};
	}
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

/**
 * Safe error serializer for logging
 */
export function serializeError(error: unknown): Record<string, unknown> {
	if (isAppError(error)) {
		return error.toJSON();
	}

	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}

	return {
		message: String(error),
	};
}
