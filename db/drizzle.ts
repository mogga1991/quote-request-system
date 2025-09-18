import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';

config({ path: ".env" }); // or .env.local

// Conditional database connection to handle build-time vs runtime
const createDb = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    // Return a mock object for build time
    return {} as any;
  }
  return drizzle(dbUrl);
};

export const db = createDb();
