import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./shared/schema.ts";

neonConfig.webSocketConstructor = ws;

console.log("DATABASE_URL from env:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("NODE_ENV:", process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set. Did you forget to provision a database?");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test a simple query
    const result = await db.select().from(schema.enquiries).limit(1);
    console.log("Query successful! Found", result.length, "enquiries");
    console.log("Sample enquiry:", result[0]);
    
    await pool.end();
    console.log("Database connection test completed successfully");
  } catch (error) {
    console.error("Database connection test failed:", error);
    process.exit(1);
  }
}

testConnection();
