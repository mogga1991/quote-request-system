import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env.local (primary) then .env (fallback)
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
