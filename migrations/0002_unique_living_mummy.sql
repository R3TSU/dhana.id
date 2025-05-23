CREATE TABLE "course_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"enrollment_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'enrolled' NOT NULL,
	"price_paid" integer,
	"access_expiration_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"content" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_enrollments_user_course_idx" ON "course_enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "course_enrollments_user_id_idx" ON "course_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "course_enrollments_course_id_idx" ON "course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_notes_user_lesson_idx" ON "lesson_notes" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_notes_user_id_idx" ON "lesson_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lesson_notes_lesson_id_idx" ON "lesson_notes" USING btree ("lesson_id");