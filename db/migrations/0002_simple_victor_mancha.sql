CREATE TABLE "quote_request_suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_request_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"notification_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_quote_supplier" UNIQUE("quote_request_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"requirements" jsonb,
	"deadline" timestamp NOT NULL,
	"attachments" jsonb,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"ai_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_request_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"line_items" jsonb,
	"total_price_cents" integer,
	"delivery_time_days" integer,
	"notes" text,
	"attachments" jsonb,
	"submitted_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_response_per_supplier" UNIQUE("quote_request_id","supplier_id")
);
--> statement-breakpoint
ALTER TABLE "quote_request_suppliers" ADD CONSTRAINT "quote_request_suppliers_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_request_suppliers" ADD CONSTRAINT "quote_request_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_responses" ADD CONSTRAINT "supplier_responses_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_responses" ADD CONSTRAINT "supplier_responses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_request_suppliers_quote_idx" ON "quote_request_suppliers" USING btree ("quote_request_id");--> statement-breakpoint
CREATE INDEX "quote_request_suppliers_supplier_idx" ON "quote_request_suppliers" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "quote_requests_opportunity_idx" ON "quote_requests" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "quote_requests_user_idx" ON "quote_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quote_requests_status_idx" ON "quote_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quote_requests_deadline_idx" ON "quote_requests" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "supplier_responses_quote_idx" ON "supplier_responses" USING btree ("quote_request_id");--> statement-breakpoint
CREATE INDEX "supplier_responses_supplier_idx" ON "supplier_responses" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_responses_status_idx" ON "supplier_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "supplier_responses_submitted_idx" ON "supplier_responses" USING btree ("submitted_at");