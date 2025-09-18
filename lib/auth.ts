import { db } from "@/db/drizzle";
import { account, session, subscription, user, verification } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-replace-in-production",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      subscription,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for testing
  },
  plugins: [
    nextCookies(),
  ],
});

// Helper for API routes to get session
export async function getSession(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const result = await auth.api.getSession({ 
      headers: {
        cookie: cookies
      }
    });
    return result;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}
