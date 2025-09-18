# API Specification: Quote Request System

**Project:** RLP Software Platform  
**Feature:** Quote Request System  
**Date:** 2025-09-18  
**Version:** 1.0  

---

## Overview

This document specifies the API endpoints for the Quote Request System, which enables sales teams to request and manage quotes from suppliers for client opportunities. The system provides AI-powered quote generation, supplier management, and comprehensive export capabilities.

## Authentication

All API endpoints require authentication using Better Auth. Include the session token in requests:

```typescript
// Headers
Authorization: Bearer <session_token>
```

### Role-Based Access Control
- **Admin**: Full access to all quote requests across the organization
- **Manager**: Access to team's quote requests and those they're assigned to  
- **User**: Access to quote requests they created or are assigned to
- **Supplier**: Limited access to respond to quotes they're invited to

---

## Core Quote Request APIs

### 1. List Quote Requests

**Endpoint:** `GET /api/quote-requests`

**Description:** Retrieve a paginated list of quote requests with filtering and sorting options.

**Query Parameters:**
```typescript
interface QueryParams {
  page?: number;           // Default: 1
  limit?: number;          // Default: 50, Max: 100
  status?: 'draft' | 'sent' | 'responded' | 'expired' | 'completed';
  opportunityId?: string;  // Filter by opportunity
  createdBy?: string;      // Filter by creator
  supplierId?: string;     // Filter by supplier
  search?: string;         // Search in title/description
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'title';
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
  dateFrom?: string;       // ISO date string
  dateTo?: string;         // ISO date string
}
```

**Response:**
```typescript
interface QuoteRequestsResponse {
  quoteRequests: {
    id: string;
    opportunityId: string;
    opportunity: {
      id: string;
      title: string;
      company: string;
    };
    title: string;
    description: string;
    status: string;
    budget: number | null;
    deadline: string | null;
    supplierCount: number;
    responseCount: number;
    aiGenerated: boolean;
    createdBy: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: string;
    updatedAt: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid query parameters
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `500` - Internal server error

**Rate Limiting:** 100 requests per minute per user

---

### 2. Create Quote Request

**Endpoint:** `POST /api/quote-requests`

**Description:** Create a new quote request either manually or with AI assistance.

**Request Body:**
```typescript
interface CreateQuoteRequestBody {
  opportunityId: string;
  title: string;
  description?: string;
  requirements?: {
    category: string;
    specification: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  budget?: number;
  deadline?: string;        // ISO date string
  supplierIds: string[];    // Array of supplier UUIDs
  useAI?: boolean;         // Default: false
  aiPrompt?: string;       // Additional context for AI generation
}
```

**Validation Rules:**
- `title`: Required, 1-255 characters
- `opportunityId`: Required, valid UUID, must exist
- `supplierIds`: Required, array of valid UUIDs, minimum 1 supplier
- `deadline`: Must be future date
- `budget`: Must be positive number if provided

**Response:**
```typescript
interface CreateQuoteRequestResponse {
  id: string;
  opportunityId: string;
  title: string;
  description: string;
  requirements: Array<{
    category: string;
    specification: string;
    priority: string;
  }>;
  budget: number | null;
  deadline: string | null;
  status: 'draft';
  aiGenerated: boolean;
  suppliersInvited: Array<{
    supplierId: string;
    supplierName: string;
    invitedAt: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation errors
- `401` - Unauthorized
- `404` - Opportunity or suppliers not found
- `409` - Duplicate quote request for opportunity
- `422` - Invalid supplier selection
- `500` - Internal server error

**Rate Limiting:** 10 requests per minute per user

---

### 3. Get Quote Request Details

**Endpoint:** `GET /api/quote-requests/[id]`

**Description:** Retrieve detailed information about a specific quote request including supplier responses.

**Path Parameters:**
- `id`: Quote request UUID

**Query Parameters:**
```typescript
interface QueryParams {
  includeResponses?: boolean; // Default: true
  includeAuditLog?: boolean;  // Default: false
}
```

**Response:**
```typescript
interface QuoteRequestDetailsResponse {
  id: string;
  opportunityId: string;
  opportunity: {
    id: string;
    title: string;
    description: string;
    company: string;
    value: number;
    requirements: any[];
  };
  title: string;
  description: string;
  requirements: Array<{
    category: string;
    specification: string;
    priority: string;
  }>;
  budget: number | null;
  deadline: string | null;
  status: string;
  aiGenerated: boolean;
  exportedAt: string | null;
  suppliers: Array<{
    id: string;
    name: string;
    email: string;
    company: string;
    status: 'invited' | 'responded' | 'declined';
    invitedAt: string;
    respondedAt: string | null;
    response?: {
      id: string;
      quotedPrice: number;
      deliveryTime: string;
      notes: string;
      attachments: string[];
      submittedAt: string;
    };
  }>;
  auditLog?: Array<{
    id: string;
    action: string;
    userId: string;
    userName: string;
    timestamp: string;
    details: any;
  }>;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (no access to this quote request)
- `404` - Quote request not found
- `500` - Internal server error

---

### 4. Update Quote Request

**Endpoint:** `PUT /api/quote-requests/[id]`

**Description:** Update an existing quote request. Only draft and sent quotes can be modified.

**Path Parameters:**
- `id`: Quote request UUID

**Request Body:**
```typescript
interface UpdateQuoteRequestBody {
  title?: string;
  description?: string;
  requirements?: Array<{
    category: string;
    specification: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  budget?: number;
  deadline?: string;
  status?: 'draft' | 'sent' | 'cancelled';
}
```

**Response:**
```typescript
interface UpdateQuoteRequestResponse {
  id: string;
  title: string;
  description: string;
  requirements: any[];
  budget: number | null;
  deadline: string | null;
  status: string;
  updatedAt: string;
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation errors
- `401` - Unauthorized
- `403` - Forbidden (no edit permissions)
- `404` - Quote request not found
- `409` - Cannot modify quote request in current status
- `500` - Internal server error

---

### 5. Delete Quote Request

**Endpoint:** `DELETE /api/quote-requests/[id]`

**Description:** Delete a quote request. Only draft quotes can be deleted.

**Path Parameters:**
- `id`: Quote request UUID

**Response:**
```typescript
interface DeleteQuoteRequestResponse {
  message: string;
  deletedAt: string;
}
```

**Status Codes:**
- `200` - Deleted successfully
- `401` - Unauthorized
- `403` - Forbidden (no delete permissions)
- `404` - Quote request not found
- `409` - Cannot delete quote request in current status
- `500` - Internal server error

---

## AI Generation APIs

### 6. Generate AI Quote Request

**Endpoint:** `POST /api/quote-requests/[id]/generate-ai`

**Description:** Use AI to generate or enhance quote request content based on opportunity data.

**Path Parameters:**
- `id`: Quote request UUID

**Request Body:**
```typescript
interface AIGenerationBody {
  prompt?: string;          // Additional context for AI
  includeRequirements?: boolean; // Default: true
  includeSpecifications?: boolean; // Default: true
  tone?: 'formal' | 'casual' | 'technical'; // Default: 'formal'
  regenerate?: boolean;     // Regenerate existing content
}
```

**Response:**
```typescript
interface AIGenerationResponse {
  title: string;
  description: string;
  requirements: Array<{
    category: string;
    specification: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  suggestedBudget?: number;
  suggestedDeadline?: string;
  confidence: number;       // 0-1 confidence score
  tokensUsed: number;
}
```

**Status Codes:**
- `200` - Generated successfully
- `400` - Invalid request parameters
- `401` - Unauthorized
- `403` - Forbidden or AI quota exceeded
- `404` - Quote request not found
- `429` - Rate limit exceeded
- `500` - AI service error
- `503` - AI service unavailable

**Rate Limiting:** 5 requests per minute per user

---

## Supplier Management APIs

### 7. Invite Suppliers

**Endpoint:** `POST /api/quote-requests/[id]/suppliers`

**Description:** Invite additional suppliers to an existing quote request.

**Path Parameters:**
- `id`: Quote request UUID

**Request Body:**
```typescript
interface InviteSuppliersBody {
  supplierIds: string[];
  customMessage?: string;
  deadline?: string;        // Override default deadline
}
```

**Response:**
```typescript
interface InviteSuppliersResponse {
  invited: Array<{
    supplierId: string;
    supplierName: string;
    email: string;
    invitedAt: string;
  }>;
  failed: Array<{
    supplierId: string;
    reason: string;
  }>;
}
```

**Status Codes:**
- `200` - Invitations sent
- `400` - Invalid supplier IDs
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Quote request not found
- `409` - Suppliers already invited
- `500` - Internal server error

---

### 8. Get Supplier Responses

**Endpoint:** `GET /api/quote-requests/[id]/responses`

**Description:** Retrieve all supplier responses for a quote request.

**Path Parameters:**
- `id`: Quote request UUID

**Query Parameters:**
```typescript
interface QueryParams {
  status?: 'pending' | 'submitted' | 'declined';
  sortBy?: 'submittedAt' | 'quotedPrice' | 'deliveryTime';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface SupplierResponsesResponse {
  responses: Array<{
    id: string;
    supplier: {
      id: string;
      name: string;
      company: string;
      email: string;
    };
    quotedPrice: number;
    deliveryTime: string;
    notes: string;
    attachments: Array<{
      filename: string;
      url: string;
      size: number;
      type: string;
    }>;
    status: 'submitted' | 'declined';
    submittedAt: string;
  }>;
  summary: {
    totalResponses: number;
    averagePrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    averageDeliveryDays: number;
  };
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Quote request not found
- `500` - Internal server error

---

## Export APIs

### 9. Export Quote Request

**Endpoint:** `POST /api/quote-requests/[id]/export`

**Description:** Generate and export quote request data in various formats.

**Path Parameters:**
- `id`: Quote request UUID

**Request Body:**
```typescript
interface ExportQuoteRequestBody {
  format: 'pdf' | 'csv' | 'excel';
  includeResponses?: boolean;  // Default: true
  includeAuditLog?: boolean;   // Default: false
  template?: 'standard' | 'detailed' | 'summary'; // Default: 'standard'
}
```

**Response:**
```typescript
interface ExportQuoteRequestResponse {
  downloadUrl: string;      // Signed URL for download
  filename: string;
  format: string;
  size: number;            // File size in bytes
  expiresAt: string;       // URL expiration
}
```

**Status Codes:**
- `200` - Export generated successfully
- `400` - Invalid format or parameters
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Quote request not found
- `500` - Export generation failed
- `503` - Export service unavailable

**Rate Limiting:** 10 exports per hour per user

---

## Bulk Operations APIs

### 10. Bulk Quote Request Operations

**Endpoint:** `POST /api/quote-requests/bulk`

**Description:** Perform bulk operations on multiple quote requests.

**Request Body:**
```typescript
interface BulkOperationBody {
  operation: 'send' | 'cancel' | 'export' | 'delete';
  quoteRequestIds: string[];
  parameters?: {
    // For send operation
    message?: string;
    deadline?: string;
    
    // For export operation
    format?: 'pdf' | 'csv' | 'excel';
    
    // For cancel operation
    reason?: string;
  };
}
```

**Response:**
```typescript
interface BulkOperationResponse {
  processed: number;
  successful: Array<{
    id: string;
    result: any;
  }>;
  failed: Array<{
    id: string;
    error: string;
  }>;
  summary: {
    totalRequested: number;
    completed: number;
    failed: number;
  };
}
```

**Status Codes:**
- `200` - Bulk operation completed
- `400` - Invalid operation or parameters
- `401` - Unauthorized
- `403` - Forbidden
- `422` - Some operations failed
- `500` - Internal server error

**Rate Limiting:** 2 bulk operations per minute per user

---

## Supplier Response APIs

### 11. Submit Supplier Response

**Endpoint:** `POST /api/quote-requests/[id]/respond`

**Description:** Submit a response to a quote request (used by suppliers).

**Path Parameters:**
- `id`: Quote request UUID

**Authentication:** Requires supplier session token or invitation token

**Request Body:**
```typescript
interface SupplierResponseBody {
  quotedPrice: number;
  deliveryTime: string;     // e.g., "2-3 weeks", "30 days"
  notes?: string;
  attachments?: Array<{
    filename: string;
    url: string;           // Pre-uploaded file URL
    size: number;
    type: string;
  }>;
  termsAccepted: boolean;
}
```

**Response:**
```typescript
interface SupplierResponseResponse {
  id: string;
  quoteRequestId: string;
  quotedPrice: number;
  deliveryTime: string;
  notes: string;
  attachments: any[];
  submittedAt: string;
  status: 'submitted';
}
```

**Status Codes:**
- `201` - Response submitted successfully
- `400` - Validation errors
- `401` - Unauthorized or invalid token
- `403` - Forbidden (not invited or deadline passed)
- `404` - Quote request not found
- `409` - Response already submitted
- `500` - Internal server error

---

## Health & Status APIs

### 12. System Health Check

**Endpoint:** `GET /api/quote-requests/health`

**Description:** Check the health status of quote request system components.

**Response:**
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    aiService: 'healthy' | 'unhealthy';
    fileStorage: 'healthy' | 'unhealthy';
    emailService: 'healthy' | 'unhealthy';
  };
  metrics: {
    activeQuoteRequests: number;
    pendingResponses: number;
    avgResponseTime: number;
  };
}
```

**Status Codes:**
- `200` - System healthy
- `503` - System unhealthy

---

## Error Response Format

All API endpoints return errors in a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error context
    field?: string;         // Field name for validation errors
    timestamp: string;
  };
  requestId: string;        // For debugging/support
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (duplicate, invalid state)
- `RATE_LIMITED` - Too many requests
- `AI_SERVICE_ERROR` - AI generation failed
- `EXPORT_FAILED` - Export generation failed
- `EMAIL_FAILED` - Email notification failed
- `INTERNAL_ERROR` - Unexpected server error

---

## Rate Limiting

Rate limits are applied per user and endpoint:

| Endpoint Type | Limit |
|---------------|-------|
| Read Operations (GET) | 100/minute |
| Write Operations (POST/PUT) | 30/minute |
| AI Generation | 5/minute |
| Export Operations | 10/hour |
| Bulk Operations | 2/minute |

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when window resets

---

## Webhooks (Future Enhancement)

The system will support webhooks for real-time notifications:

### Events
- `quote_request.created`
- `quote_request.sent`
- `quote_request.response_received`
- `quote_request.deadline_approaching`
- `quote_request.expired`

### Webhook Payload
```typescript
interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    quoteRequestId: string;
    // Event-specific data
  };
}
```

---

## Integration Notes

### OpenAI Integration
- Model: GPT-4 Turbo with structured outputs
- Token limits: 8K context, 4K output
- Rate limiting: 60 RPM organization limit
- Fallback: Manual form entry

### Cloudflare R2 Storage
- Export files stored for 90 days
- Signed URLs valid for 24 hours
- Maximum file size: 100MB per export
- Supported formats: PDF, CSV, XLSX

### Better Auth Integration
- Session-based authentication
- Role-based permissions
- Supplier invitation tokens
- Auto-logout after 8 hours inactivity

---

**Implementation Priority:**
1. Core CRUD operations (Endpoints 1-5)
2. Supplier management (Endpoints 7-8) 
3. AI generation (Endpoint 6)
4. Export functionality (Endpoint 9)
5. Bulk operations (Endpoint 10)
6. Supplier responses (Endpoint 11)