/**
 * Custom API Error class for handling application errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Error response helper
 */
export function errorResponse(statusCode: number, message: string, code?: string) {
  return Response.json(
    {
      error: message,
      code,
    },
    { status: statusCode }
  );
}

/**
 * Global error handler for API routes
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return errorResponse(error.statusCode, error.message, error.code);
  }

  if (error instanceof Error) {
    // Handle known error types
    if (error.message.includes('Unique constraint')) {
      return errorResponse(409, 'Resource already exists', 'CONFLICT');
    }

    if (error.message.includes('Foreign key constraint')) {
      return errorResponse(400, 'Invalid reference', 'INVALID_REFERENCE');
    }

    return errorResponse(500, 'An unexpected error occurred', 'INTERNAL_ERROR');
  }

  return errorResponse(500, 'An unexpected error occurred', 'INTERNAL_ERROR');
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, statusCode = 200) {
  return Response.json(data, { status: statusCode });
}

/**
 * Validation error helper
 */
export function validationError(message: string, field?: string) {
  return Response.json(
    {
      error: message,
      code: 'VALIDATION_ERROR',
      field,
    },
    { status: 400 }
  );
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(message = 'Unauthorized') {
  return Response.json(
    {
      error: message,
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

/**
 * Forbidden error helper
 */
export function forbiddenError(message = 'Forbidden') {
  return Response.json(
    {
      error: message,
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

/**
 * Not found error helper
 */
export function notFoundError(resource = 'Resource') {
  return Response.json(
    {
      error: `${resource} not found`,
      code: 'NOT_FOUND',
    },
    { status: 404 }
  );
}
