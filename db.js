import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './shared/schema.js';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the database connection
const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

// Export schema for use in other files
export { schema };

