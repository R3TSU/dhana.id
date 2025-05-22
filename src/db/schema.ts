import { pgTable, serial, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

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
});