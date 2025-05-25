CREATE TABLE "user_lesson_access_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"override_granted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_lesson_access_overrides" ADD CONSTRAINT "user_lesson_access_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_access_overrides" ADD CONSTRAINT "user_lesson_access_overrides_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_access_overrides" ADD CONSTRAINT "user_lesson_access_overrides_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;