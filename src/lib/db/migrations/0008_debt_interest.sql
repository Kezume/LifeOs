ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "interest_type" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "interest_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "interest_amount" numeric(18, 2) DEFAULT '0' NOT NULL;
