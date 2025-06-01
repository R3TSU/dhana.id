import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
// import { config } from 'dotenv';
import * as schema from "./schema"; // Import all schema objects

// Load environment variables
// config({ path: '.env' });

// For multi-branch setup
const getBranchUrl = () => {
  const env = process.env.NODE_ENV;
  if (env === "development") {
    return process.env.DEV_DATABASE_URL;
  } else if (env === "test") {
    return process.env.TEST_DATABASE_URL;
  }
  return process.env.DATABASE_URL;
};

const sql = neon(getBranchUrl()!);

// Create Drizzle instance with neon-http adapter and the schema
export const db = drizzle(sql, { schema }); // Pass the schema here
