ALTER TABLE "courses" ADD COLUMN "sort_order" integer;--> statement-breakpoint
CREATE INDEX "courses_sort_order_idx" ON "courses" USING btree ("sort_order");