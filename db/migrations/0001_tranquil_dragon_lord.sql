CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"noticeId" text NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"office" text,
	"postedDate" timestamp NOT NULL,
	"responseDeadline" timestamp NOT NULL,
	"naicsCode" text,
	"setAsideCode" text,
	"classificationCode" text,
	"description" text,
	"solicitationNumber" text,
	"contactEmail" text,
	"contactPhone" text,
	"place" text,
	"additionalInfo" text,
	"link" text,
	"status" text DEFAULT 'active' NOT NULL,
	"estimatedValue" numeric(12, 2),
	"contractType" text,
	"requirements" jsonb,
	"rawData" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_noticeId_unique" UNIQUE("noticeId")
);
--> statement-breakpoint
CREATE TABLE "opportunityAnalysis" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunityId" text NOT NULL,
	"userId" text NOT NULL,
	"analysisData" jsonb,
	"matchedSuppliers" jsonb,
	"estimatedPricing" jsonb,
	"complianceChecklist" jsonb,
	"riskAssessment" jsonb,
	"recommendations" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunityId" text NOT NULL,
	"supplierId" text NOT NULL,
	"userId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requestedItems" jsonb,
	"totalPrice" numeric(12, 2),
	"deliveryTime" integer,
	"notes" text,
	"supplierResponse" jsonb,
	"requestSentAt" timestamp DEFAULT now() NOT NULL,
	"responseReceivedAt" timestamp,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"duns" text,
	"cage" text,
	"address" text,
	"city" text,
	"state" text,
	"zipCode" text,
	"country" text DEFAULT 'USA' NOT NULL,
	"contactName" text,
	"contactEmail" text,
	"contactPhone" text,
	"website" text,
	"gsaSchedule" boolean DEFAULT false NOT NULL,
	"naicsCodes" jsonb,
	"certifications" jsonb,
	"capabilities" jsonb,
	"pastPerformance" jsonb,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_duns_unique" UNIQUE("duns"),
	CONSTRAINT "suppliers_cage_unique" UNIQUE("cage")
);
--> statement-breakpoint
ALTER TABLE "opportunityAnalysis" ADD CONSTRAINT "opportunityAnalysis_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunityAnalysis" ADD CONSTRAINT "opportunityAnalysis_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplierId_suppliers_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;