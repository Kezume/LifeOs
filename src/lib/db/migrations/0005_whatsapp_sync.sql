ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "receipt_url" text;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "raw_message" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_whatsapp_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"phone_number" text NOT NULL,
	"pairing_code" text NOT NULL,
	"default_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_whatsapp_connections_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "user_whatsapp_connections_pairing_code_unique" UNIQUE("pairing_code")
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_whatsapp_connections" ADD CONSTRAINT "user_whatsapp_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_whatsapp_connections" ADD CONSTRAINT "user_whatsapp_connections_default_account_id_finance_accounts_id_fk" FOREIGN KEY ("default_account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wa_connections_user_id_idx" ON "user_whatsapp_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wa_connections_phone_idx" ON "user_whatsapp_connections" USING btree ("phone_number");
