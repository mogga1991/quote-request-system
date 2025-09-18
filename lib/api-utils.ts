import { NextResponse } from 'next/server';
import { z } from 'zod';

// Standard API error types
export type APIError = {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
};

// Pre-defined error types
export const API_ERRORS = {
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    statusCode: 401
  },
  FORBIDDEN: {
    code: 'FORBIDDEN', 
    message: 'Insufficient permissions',
    statusCode: 403
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    statusCode: 400
  },
  CONFLICT: {
    code: 'CONFLICT',
    message: 'Resource conflict',
    statusCode: 409
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    statusCode: 429
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    statusCode: 500
  }
} as const;

// Standard API response wrapper
export function createAPIResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
) {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }, { status: statusCode });
}

// Standard API error response wrapper
export function createAPIError(
  error: Partial<APIError> & { code: string; message: string },
  details?: any
) {
  const statusCode = error.statusCode || 500;
  
  return NextResponse.json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details,
    },
    timestamp: new Date().toISOString()
  }, { status: statusCode });
}

// Error handler for common API errors
export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return createAPIError(API_ERRORS.VALIDATION_ERROR, error.errors);
  }

  // Database constraint errors
  if (error instanceof Error) {
    if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
      return createAPIError(API_ERRORS.CONFLICT, {
        message: 'Resource already exists',
        originalError: error.message
      });
    }

    if (error.message.includes('foreign key constraint')) {
      return createAPIError(API_ERRORS.VALIDATION_ERROR, {
        message: 'Invalid reference to related resource',
        originalError: error.message
      });
    }

    // Custom business logic errors
    if (error.message.includes('not found')) {
      return createAPIError(API_ERRORS.NOT_FOUND, {
        originalError: error.message
      });
    }

    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      return createAPIError(API_ERRORS.FORBIDDEN, {
        originalError: error.message
      });
    }
  }

  // Fallback to internal server error
  return createAPIError(API_ERRORS.INTERNAL_ERROR);
}

// Pagination utilities
export interface PaginationParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    page: number;
    totalPages: number;
  };
}

export function createPaginationResponse<T>(
  data: T[],
  total: number,
  params: Required<PaginationParams>
): PaginationResult<T> {
  const page = Math.floor(params.offset / params.limit) + 1;
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data,
    pagination: {
      total,
      limit: params.limit,
      offset: params.offset,
      hasMore: total > params.offset + params.limit,
      page,
      totalPages
    }
  };
}

// Validation schemas for common API parameters
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const idSchema = z.string().min(1, 'ID is required');

// Request validation wrapper
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new Error('Invalid request data');
  }
}

// Authentication check utility
export function requireAuth(session: any) {
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }
  return session.user;
}

// Resource ownership check utility
export function requireOwnership(resourceUserId: string, sessionUserId: string) {
  if (resourceUserId !== sessionUserId) {
    throw new Error('Insufficient permissions to access this resource');
  }
}

// Safe async handler wrapper
export function asyncHandler(
  handler: (request: Request, params?: any) => Promise<NextResponse>
) {
  return async (request: Request, params?: any) => {
    try {
      return await handler(request, params);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

// Rate limiting check (placeholder for future implementation)
export function checkRateLimit(userId: string, endpoint: string): boolean {
  // TODO: Implement rate limiting logic
  // This could use Redis or memory cache to track request counts
  return true;
}

// API key validation (for supplier endpoints)
export function validateAPIKey(apiKey: string): { supplierId: string } | null {
  // TODO: Implement API key validation for supplier access
  // This would validate supplier API keys for external access
  return null;
}

// Sanitize output data (remove sensitive fields)
export function sanitizeOutput<T extends Record<string, any>>(
  data: T,
  sensitiveFields: string[] = ['password', 'apiKey', 'internalNotes']
): T {
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
}

// Audit logging utility
export function logAPIAccess(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: any
) {
  // TODO: Implement audit logging
  console.log('API Access:', {
    userId,
    action,
    resource,
    resourceId,
    metadata,
    timestamp: new Date().toISOString()
  });
}