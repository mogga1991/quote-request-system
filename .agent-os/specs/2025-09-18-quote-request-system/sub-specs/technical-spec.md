# Technical Specification: Quote Request System

**Project:** RLP Software Platform  
**Feature:** Quote Request System  
**Date:** 2025-09-18  
**Version:** 1.0  

---

## Technical Requirements

### Frontend Implementation

#### UI Components
- **Form Components**: Leverage existing shadcn/ui components for consistent styling
  - Use `<Form>`, `<Input>`, `<Textarea>`, `<Select>`, `<Checkbox>` components
  - Implement multi-step form wizard using `<Tabs>` component for quote request creation
  - Add `<DataTable>` component for displaying quote requests list with sorting/filtering
  - Use `<Dialog>` for modal interactions (edit, preview, bulk actions)

#### Pages & Routes
- `/dashboard/quote-requests` - Main quote requests listing page
- `/dashboard/quote-requests/create` - Create new quote request form
- `/dashboard/quote-requests/[id]` - View/edit specific quote request
- `/dashboard/quote-requests/[id]/responses` - View supplier responses
- `/dashboard/quote-requests/bulk` - Bulk operations interface

#### State Management
- Use React Server Components for initial data fetching
- Implement `@tanstack/react-query` for client-side state management and caching
- Form state managed with `react-hook-form` + `zod` validation schemas

### Backend Implementation

#### Database Schema (Drizzle ORM)
```typescript
// db/schema/quote-requests.ts
export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requirements: jsonb('requirements'), // AI-generated structured requirements
  budget: decimal('budget', { precision: 12, scale: 2 }),
  deadline: timestamp('deadline'),
  status: varchar('status', { length: 50 }).default('draft'),
  aiGenerated: boolean('ai_generated').default(false),
  exportedAt: timestamp('exported_at'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const quoteRequestSuppliers = pgTable('quote_request_suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  invitedAt: timestamp('invited_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
  status: varchar('status', { length: 50 }).default('invited')
});

export const supplierResponses = pgTable('supplier_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  quotedPrice: decimal('quoted_price', { precision: 12, scale: 2 }),
  deliveryTime: varchar('delivery_time', { length: 100 }),
  notes: text('notes'),
  attachments: jsonb('attachments'), // Array of file URLs
  submittedAt: timestamp('submitted_at').defaultNow()
});
```

#### API Routes (Next.js App Router)
- `app/api/quote-requests/route.ts` - GET (list), POST (create)
- `app/api/quote-requests/[id]/route.ts` - GET, PUT, DELETE
- `app/api/quote-requests/[id]/generate-ai/route.ts` - POST (AI generation)
- `app/api/quote-requests/[id]/export/route.ts` - POST (export to R2)
- `app/api/quote-requests/[id]/suppliers/route.ts` - GET, POST (invite suppliers)
- `app/api/quote-requests/bulk/route.ts` - POST (bulk operations)

#### AI Integration (OpenAI)
```typescript
// lib/services/ai-quote-generator.ts
export async function generateQuoteRequest(opportunity: Opportunity) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "Generate a structured quote request based on opportunity details..."
      },
      {
        role: "user", 
        content: JSON.stringify(opportunity)
      }
    ],
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content);
}
```

#### File Storage & Export (Cloudflare R2)
```typescript
// lib/services/document-export.ts
export async function exportQuoteRequest(quoteRequestId: string) {
  const quoteRequest = await getQuoteRequestWithResponses(quoteRequestId);
  const pdfBuffer = await generateQuoteRequestPDF(quoteRequest);
  
  const key = `exports/quote-requests/${quoteRequestId}-${Date.now()}.pdf`;
  
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf'
  }));
  
  return getSignedUrl(key);
}
```

### Authentication & Authorization
- Use existing Better Auth setup for user authentication
- Implement role-based access control:
  - Admin: Full access to all quote requests
  - Manager: Access to team's quote requests
  - User: Access to own created quote requests
- Suppliers have separate authentication flow for responding to quotes

### Real-time Features
- Use Server-Sent Events for real-time updates on quote request status changes
- WebSocket connection for live collaboration on quote request editing (future enhancement)

### Performance Optimizations
- Implement database indexes on frequently queried fields:
  - `quote_requests.opportunity_id`
  - `quote_requests.created_by`
  - `quote_requests.status`
  - `supplier_responses.quote_request_id`
- Use Next.js edge caching for static quote request data
- Implement pagination for large quote request lists (50 items per page)

### Data Validation & Type Safety
```typescript
// lib/schemas/quote-request.ts
export const createQuoteRequestSchema = z.object({
  opportunityId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  requirements: z.array(z.object({
    category: z.string(),
    specification: z.string(),
    priority: z.enum(['high', 'medium', 'low'])
  })),
  budget: z.number().positive().optional(),
  deadline: z.date().min(new Date()),
  supplierIds: z.array(z.string().uuid()).min(1)
});
```

### Error Handling & Logging
- Use structured logging with context for all quote request operations
- Implement retry logic for AI generation failures
- Graceful fallbacks when file export services are unavailable
- User-friendly error messages for validation failures

### Testing Strategy
- Unit tests for AI generation logic and data transformations
- Integration tests for API routes and database operations
- E2E tests for critical user flows (create quote request, supplier response)
- Load testing for bulk operations and export functionality

---

## External Dependencies

### New Dependencies Required

#### PDF Generation
**Package:** `@react-pdf/renderer`  
**Version:** `^4.0.0`  
**Reason:** Generate professional PDF documents for quote request exports. React-based components allow consistent styling with the web interface.

#### File Upload Enhancement
**Package:** `@aws-sdk/client-s3` (already installed)  
**Version:** Current `^3.800.0`  
**Usage:** Enhanced for Cloudflare R2 compatibility for document exports and supplier response attachments.

#### Date/Time Utilities
**Package:** `date-fns` (already installed)  
**Version:** Current `^4.1.0`  
**Usage:** Enhanced date formatting and validation for quote deadlines and response tracking.

#### Bulk Operations
**Package:** `p-limit`  
**Version:** `^6.0.0`  
**Reason:** Control concurrency for bulk operations to prevent overwhelming the database and external services.

### Infrastructure Dependencies

#### Cloudflare R2 Configuration
- **Purpose:** Store exported quote request documents and supplier attachments
- **Configuration:** Requires R2 bucket setup with proper CORS and access policies
- **Environment Variables:**
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`  
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_URL`

#### OpenAI API Enhancement
- **Current Usage:** Basic chat completions
- **Enhancement:** Structured output for quote request generation
- **Rate Limiting:** Implement request queuing for bulk AI operations
- **Fallback:** Manual form entry when AI service is unavailable

### Database Migration Requirements
- New tables: `quote_requests`, `quote_request_suppliers`, `supplier_responses`
- Indexes for performance optimization
- Foreign key constraints to existing `opportunities` and `suppliers` tables
- Data retention policies for exported documents (90 days default)

---

## Implementation Notes

### Phase 1: Core Functionality (Week 1-2)
- Database schema and migrations
- Basic CRUD operations for quote requests
- Integration with existing opportunity system
- Simple form-based quote request creation

### Phase 2: AI Integration (Week 3)
- OpenAI integration for automated quote generation
- AI-powered requirement extraction from opportunities
- Fallback mechanisms for AI failures

### Phase 3: Supplier Integration (Week 4)
- Supplier invitation system
- Response collection interface
- Email notifications for suppliers

### Phase 4: Export & Analytics (Week 5-6)
- PDF export functionality
- Cloudflare R2 integration
- Audit trail and reporting
- Bulk operations support

### Security Considerations
- All file uploads validated and scanned
- Supplier access restricted to invited quote requests only
- Audit logging for all quote request modifications
- Rate limiting on AI generation endpoints
- Signed URLs for secure file access

---

**Next Steps:** Proceed with database migration creation and core API route implementation.