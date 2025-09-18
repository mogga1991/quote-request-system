import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    // Test the auth configuration
    const testResult = {
      message: 'Auth test endpoint',
      hasAuth: !!auth,
      envVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      }
    };

    return NextResponse.json(testResult);
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}