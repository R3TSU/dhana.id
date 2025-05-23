import { pgTable, serial, text, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

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

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    clerk_user_id: text('clerk_user_id').unique().notNull(),
    email: text('email'),
    first_name: text('first_name'),
    last_name: text('last_name'),
    role: text('role').default('user'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index("clerk_user_id_idx").on(table.clerk_user_id),
]);

export const courses = pgTable('courses', {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),   
    thumbnail_url: text('thumbnail_url'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index("courses_slug_idx").on(table.slug),
    uniqueIndex("courses_title_idx").on(table.title)
]);

export const lessons = pgTable('lessons', {
    id: serial('id').primaryKey(),
    course_id: integer('course_id').notNull().references(() => courses.id),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    thumbnail_url: text('thumbnail_url'),
    video_url: text('video_url').notNull(),
    day_number: integer('day_number').notNull().default(1),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index("lessons_course_id_idx").on(table.course_id),
    index("lessons_slug_idx").on(table.slug),
    uniqueIndex("lessons_title_idx").on(table.title)
]);