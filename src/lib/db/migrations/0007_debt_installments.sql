ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "is_installment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "total_installments" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "paid_installments" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "installment_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "due_day" integer;
