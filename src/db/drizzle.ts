import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// For multi-branch setup
const getBranchUrl = () => {
  const env = process.env.NODE_ENV;
  if (env === 'development') {
    return process.env.DEV_DATABASE_URL;
  } else if (env === 'test') {
    return process.env.TEST_DATABASE_URL;
  }
  return process.env.DATABASE_URL;
};

const sql = neon(getBranchUrl()!);

// Create Drizzle instance with neon-http adapter
export const db = drizzle({ client: sql });