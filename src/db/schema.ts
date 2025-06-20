import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// CREATE TABLE users (
//     id SERIAL PRIMARY KEY,
//     clerk_user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk's user ID
//     email VARCHAR(255),
//     first_name VARCHAR(100),
//     last_name VARCHAR(100),
//     role VARCHAR(50) DEFAULT 'user',
//     created_at TIMESTAMP DEFAULT NOW(),
//     updated_at TIMESTAMP DEFAULT NOW()
//   );

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerk_user_id: text("clerk_user_id").unique().notNull(),
    email: text("email"),
    fullName: text("full_name"), // Changed from first_name and last_name
    whatsappNumber: text("whatsapp_number"), // Added for WhatsApp number
    address: text("address"), // For city or district
    birthDay: integer("birth_day"), // Day of birth (1-31)
    birthMonth: integer("birth_month"), // Month of birth (1-12)
    birthYear: integer("birth_year"), // Year of birth (optional)
    role: text("role").default("user"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("clerk_user_id_idx").on(table.clerk_user_id)],
);

export const courses = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    thumbnail_url: text("thumbnail_url"),
    is_active: boolean("is_active").default(true).notNull(),
    start_date: timestamp("start_date"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("courses_slug_idx").on(table.slug),
    uniqueIndex("courses_title_idx").on(table.title),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    course_id: integer("course_id")
      .notNull()
      .references(() => courses.id),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    workbook: text("workbook"), // Added workbook field for reflection questions
    thumbnail_url: text("thumbnail_url"),
    video_url: text("video_url").notNull(),
    day_number: integer("day_number").notNull().default(1),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("lessons_course_id_idx").on(table.course_id),
    index("lessons_slug_idx").on(table.slug),
    uniqueIndex("lessons_title_idx").on(table.title),
  ],
);

export const lesson_notes = pgTable(
  "lesson_notes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    content: text("content").default(""), // Default to empty string, can be updated
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()), // Automatically update timestamp
  },
  (table) => [
    uniqueIndex("lesson_notes_user_lesson_idx").on(
      table.userId,
      table.lessonId,
    ), // User can only have one note per lesson
    index("lesson_notes_user_id_idx").on(table.userId),
    index("lesson_notes_lesson_id_idx").on(table.lessonId),
  ],
);

export const course_enrollments = pgTable(
  "course_enrollments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
    status: text("status").default("enrolled").notNull(), // e.g., 'enrolled', 'pending', 'expired'
    pricePaid: integer("price_paid"), // Amount in cents, null if free or not applicable
    accessExpirationDate: timestamp("access_expiration_date"), // For time-limited access
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("course_enrollments_user_course_idx").on(
      table.userId,
      table.courseId,
    ),
    index("course_enrollments_user_id_idx").on(table.userId),
    index("course_enrollments_course_id_idx").on(table.courseId),
  ],
);

export const userLessonAccessOverrides = pgTable(
  "user_lesson_access_overrides",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    overrideGrantedAt: timestamp("override_granted_at").defaultNow().notNull(),
  },
);

export const userLessonAccessOverridesRelations = relations(
  userLessonAccessOverrides,
  ({ one }) => ({
    user: one(users, {
      fields: [userLessonAccessOverrides.userId],
      references: [users.id],
    }),
    lesson: one(lessons, {
      fields: [userLessonAccessOverrides.lessonId],
      references: [lessons.id],
    }),
    course: one(courses, {
      fields: [userLessonAccessOverrides.courseId],
      references: [courses.id],
    }),
  }),
);
