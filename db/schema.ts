import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  numeric,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

// Better Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Subscription table for Polar webhook data
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt").notNull(),
  modifiedAt: timestamp("modifiedAt"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  recurringInterval: text("recurringInterval").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  canceledAt: timestamp("canceledAt"),
  startedAt: timestamp("startedAt").notNull(),
  endsAt: timestamp("endsAt"),
  endedAt: timestamp("endedAt"),
  customerId: text("customerId").notNull(),
  productId: text("productId").notNull(),
  discountId: text("discountId"),
  checkoutId: text("checkoutId").notNull(),
  customerCancellationReason: text("customerCancellationReason"),
  customerCancellationComment: text("customerCancellationComment"),
  metadata: text("metadata"), // JSON string
  customFieldData: text("customFieldData"), // JSON string
  userId: text("userId").references(() => user.id),
});

// Government Contracting Tables
export const opportunities = pgTable("opportunities", {
  id: text("id").primaryKey(),
  noticeId: text("noticeId").notNull().unique(), // SAM.gov notice ID
  title: text("title").notNull(),
  department: text("department").notNull(),
  office: text("office"),
  postedDate: timestamp("postedDate").notNull(),
  responseDeadline: timestamp("responseDeadline").notNull(),
  naicsCode: text("naicsCode"),
  setAsideCode: text("setAsideCode"),
  classificationCode: text("classificationCode"),
  description: text("description"),
  solicitationNumber: text("solicitationNumber"),
  contactEmail: text("contactEmail"),
  contactPhone: text("contactPhone"),
  place: text("place"),
  additionalInfo: text("additionalInfo"),
  link: text("link"),
  status: text("status").notNull().default("active"), // active, expired, awarded
  estimatedValue: numeric("estimatedValue", { precision: 12, scale: 2 }),
  contractType: text("contractType"),
  requirements: jsonb("requirements"), // Parsed requirements from AI
  rawData: jsonb("rawData"), // Full SAM.gov response
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  duns: text("duns").unique(),
  cage: text("cage").unique(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zipCode"),
  country: text("country").notNull().default("USA"),
  contactName: text("contactName"),
  contactEmail: text("contactEmail"),
  contactPhone: text("contactPhone"),
  website: text("website"),
  gsaSchedule: boolean("gsaSchedule").notNull().default(false),
  naicsCodes: jsonb("naicsCodes"), // Array of NAICS codes
  certifications: jsonb("certifications"), // Small business, veteran-owned, etc.
  capabilities: jsonb("capabilities"), // Products/services offered
  pastPerformance: jsonb("pastPerformance"), // Contract history
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"), // 0-5 rating
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunityId")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  supplierId: text("supplierId")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, received, expired
  requestedItems: jsonb("requestedItems"), // Items requested in quote
  totalPrice: numeric("totalPrice", { precision: 12, scale: 2 }),
  deliveryTime: integer("deliveryTime"), // Days
  notes: text("notes"),
  supplierResponse: jsonb("supplierResponse"), // Full supplier response
  requestSentAt: timestamp("requestSentAt").notNull().defaultNow(),
  responseReceivedAt: timestamp("responseReceivedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const opportunityAnalysis = pgTable("opportunityAnalysis", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunityId")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  analysisData: jsonb("analysisData"), // AI-parsed requirements
  matchedSuppliers: jsonb("matchedSuppliers"), // Array of supplier matches with scores
  estimatedPricing: jsonb("estimatedPricing"), // Price estimates by category
  complianceChecklist: jsonb("complianceChecklist"), // Compliance requirements
  riskAssessment: jsonb("riskAssessment"), // Risk analysis
  recommendations: jsonb("recommendations"), // AI recommendations
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Quote Request System Tables
export const quoteRequests = pgTable("quote_requests", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, sent, expired, completed
  requirements: jsonb("requirements"), // AI-generated or manual requirements
  deadline: timestamp("deadline").notNull(),
  attachments: jsonb("attachments"), // File metadata array
  aiGenerated: boolean("ai_generated").notNull().default(false),
  aiPrompt: text("ai_prompt"), // Original prompt used for AI generation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  opportunityIdx: index("quote_requests_opportunity_idx").on(table.opportunityId),
  userIdx: index("quote_requests_user_idx").on(table.userId),
  statusIdx: index("quote_requests_status_idx").on(table.status),
  deadlineIdx: index("quote_requests_deadline_idx").on(table.deadline),
}));

export const quoteRequestSuppliers = pgTable("quote_request_suppliers", {
  id: text("id").primaryKey(),
  quoteRequestId: text("quote_request_id")
    .notNull()
    .references(() => quoteRequests.id, { onDelete: "cascade" }),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationMethod: text("notification_method"), // email, platform, manual
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueQuoteSupplier: unique("unique_quote_supplier").on(table.quoteRequestId, table.supplierId),
  quoteRequestIdx: index("quote_request_suppliers_quote_idx").on(table.quoteRequestId),
  supplierIdx: index("quote_request_suppliers_supplier_idx").on(table.supplierId),
}));

export const supplierResponses = pgTable("supplier_responses", {
  id: text("id").primaryKey(),
  quoteRequestId: text("quote_request_id")
    .notNull()
    .references(() => quoteRequests.id, { onDelete: "cascade" }),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, submitted, declined, expired
  lineItems: jsonb("line_items"), // Array of quoted items with pricing
  totalPriceCents: integer("total_price_cents"), // Price in cents to avoid floating point issues
  deliveryTimedays: integer("delivery_time_days"),
  notes: text("notes"),
  attachments: jsonb("attachments"), // File metadata array
  submittedAt: timestamp("submitted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueResponsePerSupplier: unique("unique_response_per_supplier").on(table.quoteRequestId, table.supplierId),
  quoteRequestIdx: index("supplier_responses_quote_idx").on(table.quoteRequestId),
  supplierIdx: index("supplier_responses_supplier_idx").on(table.supplierId),
  statusIdx: index("supplier_responses_status_idx").on(table.status),
  submittedIdx: index("supplier_responses_submitted_idx").on(table.submittedAt),
}));
