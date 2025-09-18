# Database Schema Specification: Quote Request System

**Version:** 1.0  
**Date:** 2025-09-18  
**Author:** Agent OS  
**Status:** Draft

## Overview

This document defines the database schema changes required for the Quote Request System. The system extends the existing opportunities and suppliers functionality with new tables for managing quote requests, supplier assignments, and response tracking.

## Architecture

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Migration System:** Drizzle migrations
- **Existing Tables:** `opportunities`, `suppliers`, `users`

## New Tables

### 1. quote_requests

Stores metadata for quote requests created from opportunities.

```sql
CREATE TABLE quote_requests (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  budget_min INTEGER, -- in cents
  budget_max INTEGER, -- in cents
  currency VARCHAR(3) DEFAULT 'USD',
  deadline DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'responses_received', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_quote_requests_opportunity_id ON quote_requests(opportunity_id);
CREATE INDEX idx_quote_requests_created_by ON quote_requests(created_by);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_deadline ON quote_requests(deadline);
```

### 2. quote_request_suppliers

Many-to-many relationship between quote requests and suppliers.

```sql
CREATE TABLE quote_request_suppliers (
  id SERIAL PRIMARY KEY,
  quote_request_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_status VARCHAR(50) DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'sent', 'viewed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(quote_request_id, supplier_id)
);

-- Indexes
CREATE INDEX idx_quote_request_suppliers_quote_request_id ON quote_request_suppliers(quote_request_id);
CREATE INDEX idx_quote_request_suppliers_supplier_id ON quote_request_suppliers(supplier_id);
CREATE INDEX idx_quote_request_suppliers_status ON quote_request_suppliers(invitation_status);
```

### 3. supplier_responses

Tracks supplier responses to quote requests.

```sql
CREATE TABLE supplier_responses (
  id SERIAL PRIMARY KEY,
  quote_request_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  quote_amount INTEGER, -- in cents
  currency VARCHAR(3) DEFAULT 'USD',
  delivery_timeline VARCHAR(255),
  notes TEXT,
  attachments JSONB, -- Array of file URLs/metadata
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(quote_request_id, supplier_id)
);

-- Indexes
CREATE INDEX idx_supplier_responses_quote_request_id ON supplier_responses(quote_request_id);
CREATE INDEX idx_supplier_responses_supplier_id ON supplier_responses(supplier_id);
CREATE INDEX idx_supplier_responses_status ON supplier_responses(status);
CREATE INDEX idx_supplier_responses_submitted_at ON supplier_responses(submitted_at);
```

## Drizzle Schema Definitions

```typescript
// db/schema.ts additions

import { 
  serial, 
  integer, 
  varchar, 
  text, 
  date,
  timestamp, 
  jsonb,
  pgTable,
  unique,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Quote Requests Table
export const quoteRequests = pgTable('quote_requests', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id').notNull().references(() => opportunities.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requirements: text('requirements'),
  budgetMin: integer('budget_min'), // in cents
  budgetMax: integer('budget_max'), // in cents
  currency: varchar('currency', { length: 3 }).default('USD'),
  deadline: date('deadline'),
  status: varchar('status', { length: 50 }).default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => ({
  opportunityIdIdx: index('idx_quote_requests_opportunity_id').on(table.opportunityId),
  createdByIdx: index('idx_quote_requests_created_by').on(table.createdBy),
  statusIdx: index('idx_quote_requests_status').on(table.status),
  deadlineIdx: index('idx_quote_requests_deadline').on(table.deadline),
}));

// Quote Request Suppliers Junction Table
export const quoteRequestSuppliers = pgTable('quote_request_suppliers', {
  id: serial('id').primaryKey(),
  quoteRequestId: integer('quote_request_id').notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow(),
  invitationStatus: varchar('invitation_status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueQuoteSupplier: unique().on(table.quoteRequestId, table.supplierId),
  quoteRequestIdIdx: index('idx_quote_request_suppliers_quote_request_id').on(table.quoteRequestId),
  supplierIdIdx: index('idx_quote_request_suppliers_supplier_id').on(table.supplierId),
  statusIdx: index('idx_quote_request_suppliers_status').on(table.invitationStatus),
}));

// Supplier Responses Table
export const supplierResponses = pgTable('supplier_responses', {
  id: serial('id').primaryKey(),
  quoteRequestId: integer('quote_request_id').notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  quoteAmount: integer('quote_amount'), // in cents
  currency: varchar('currency', { length: 3 }).default('USD'),
  deliveryTimeline: varchar('delivery_timeline', { length: 255 }),
  notes: text('notes'),
  attachments: jsonb('attachments'), // Array of file metadata
  status: varchar('status', { length: 50 }).default('draft'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueQuoteSupplierResponse: unique().on(table.quoteRequestId, table.supplierId),
  quoteRequestIdIdx: index('idx_supplier_responses_quote_request_id').on(table.quoteRequestId),
  supplierIdIdx: index('idx_supplier_responses_supplier_id').on(table.supplierId),
  statusIdx: index('idx_supplier_responses_status').on(table.status),
  submittedAtIdx: index('idx_supplier_responses_submitted_at').on(table.submittedAt),
}));

// Relations
export const quoteRequestsRelations = relations(quoteRequests, ({ one, many }) => ({
  opportunity: one(opportunities, {
    fields: [quoteRequests.opportunityId],
    references: [opportunities.id],
  }),
  creator: one(users, {
    fields: [quoteRequests.createdBy],
    references: [users.id],
  }),
  suppliers: many(quoteRequestSuppliers),
  responses: many(supplierResponses),
}));

export const quoteRequestSuppliersRelations = relations(quoteRequestSuppliers, ({ one }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [quoteRequestSuppliers.quoteRequestId],
    references: [quoteRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [quoteRequestSuppliers.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierResponsesRelations = relations(supplierResponses, ({ one }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [supplierResponses.quoteRequestId],
    references: [quoteRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierResponses.supplierId],
    references: [suppliers.id],
  }),
}));

// Update existing relations
export const opportunitiesRelations = relations(opportunities, ({ many }) => ({
  // ... existing relations
  quoteRequests: many(quoteRequests),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  // ... existing relations
  quoteRequestAssignments: many(quoteRequestSuppliers),
  responses: many(supplierResponses),
}));

export const usersRelations = relations(users, ({ many }) => ({
  // ... existing relations
  createdQuoteRequests: many(quoteRequests),
}));
```

## Migration Script

```sql
-- Migration: 0002_add_quote_request_system.sql

-- Create quote_requests table
CREATE TABLE quote_requests (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  deadline DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'responses_received', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for quote_requests
CREATE INDEX idx_quote_requests_opportunity_id ON quote_requests(opportunity_id);
CREATE INDEX idx_quote_requests_created_by ON quote_requests(created_by);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_deadline ON quote_requests(deadline);

-- Create quote_request_suppliers junction table
CREATE TABLE quote_request_suppliers (
  id SERIAL PRIMARY KEY,
  quote_request_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_status VARCHAR(50) DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'sent', 'viewed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(quote_request_id, supplier_id)
);

-- Create indexes for quote_request_suppliers
CREATE INDEX idx_quote_request_suppliers_quote_request_id ON quote_request_suppliers(quote_request_id);
CREATE INDEX idx_quote_request_suppliers_supplier_id ON quote_request_suppliers(supplier_id);
CREATE INDEX idx_quote_request_suppliers_status ON quote_request_suppliers(invitation_status);

-- Create supplier_responses table
CREATE TABLE supplier_responses (
  id SERIAL PRIMARY KEY,
  quote_request_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  quote_amount INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  delivery_timeline VARCHAR(255),
  notes TEXT,
  attachments JSONB,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(quote_request_id, supplier_id)
);

-- Create indexes for supplier_responses
CREATE INDEX idx_supplier_responses_quote_request_id ON supplier_responses(quote_request_id);
CREATE INDEX idx_supplier_responses_supplier_id ON supplier_responses(supplier_id);
CREATE INDEX idx_supplier_responses_status ON supplier_responses(status);
CREATE INDEX idx_supplier_responses_submitted_at ON supplier_responses(submitted_at);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quote_requests_updated_at 
    BEFORE UPDATE ON quote_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_request_suppliers_updated_at 
    BEFORE UPDATE ON quote_request_suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_responses_updated_at 
    BEFORE UPDATE ON supplier_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Data Relationships

### Foreign Key Relationships

1. **quote_requests.opportunity_id** → opportunities.id (CASCADE DELETE)
2. **quote_requests.created_by** → users.id (RESTRICT DELETE)
3. **quote_request_suppliers.quote_request_id** → quote_requests.id (CASCADE DELETE)
4. **quote_request_suppliers.supplier_id** → suppliers.id (CASCADE DELETE)
5. **supplier_responses.quote_request_id** → quote_requests.id (CASCADE DELETE)
6. **supplier_responses.supplier_id** → suppliers.id (CASCADE DELETE)

### Business Logic Constraints

1. **Unique Constraint:** Each supplier can only be invited once per quote request
2. **Unique Constraint:** Each supplier can only submit one response per quote request
3. **Status Validation:** Enum constraints ensure valid status transitions
4. **Currency Consistency:** All monetary values use consistent currency codes

## Performance Considerations

### Indexes

- **Primary Access Patterns:** Query by opportunity, supplier, status, and date ranges
- **Compound Indexes:** Consider adding for common query combinations
- **JSONB Indexes:** May need GIN indexes on attachments field for document searches

### Optimization Recommendations

1. **Pagination:** Use cursor-based pagination for large result sets
2. **Caching:** Cache frequently accessed quote request summaries
3. **Archival:** Consider partitioning old quote requests by date
4. **Monitoring:** Track query performance on deadline and status filters

## Data Types and Validation

### Monetary Values
- All amounts stored in cents (INTEGER) to avoid floating-point precision issues
- Currency codes follow ISO 4217 standard (3-character codes)

### Status Enums
- **Quote Request Status:** draft, sent, responses_received, closed, cancelled
- **Invitation Status:** pending, sent, viewed, declined
- **Response Status:** draft, submitted, accepted, rejected, withdrawn

### JSON Schema for Attachments
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "filename": { "type": "string" },
      "url": { "type": "string" },
      "size": { "type": "integer" },
      "mimeType": { "type": "string" },
      "uploadedAt": { "type": "string", "format": "date-time" }
    },
    "required": ["filename", "url", "size", "mimeType", "uploadedAt"]
  }
}
```

## Implementation Notes

1. **Migration Order:** Run this migration after existing opportunities and suppliers tables
2. **Data Seeding:** No initial data required - tables start empty
3. **Rollback Plan:** Drop tables in reverse dependency order if rollback needed
4. **Testing:** Verify foreign key constraints and unique constraints work as expected

## Security Considerations

- **Access Control:** Ensure row-level security policies are applied
- **Data Privacy:** Quote amounts and supplier responses are sensitive data
- **Audit Trail:** All tables include created_at and updated_at for tracking changes
- **Soft Deletes:** Consider implementing soft deletes for critical business data

---

**Next Steps:**
1. Review schema with stakeholders
2. Generate Drizzle migration files
3. Test migration on development environment
4. Implement data access layer with proper validation
5. Add database seeding for development/testing