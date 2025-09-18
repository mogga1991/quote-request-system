import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL ? 'Present' : 'Missing',
      BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET ? 'Present' : 'Missing',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Missing',
      NODE_ENV: process.env.NODE_ENV,
    };

    // Test database connection
    let dbStatus = 'Unknown';
    try {
      const { db } = await import('@/db/drizzle');
      const { user } = await import('@/db/schema');
      
      // Try a simple query
      const result = await db.select().from(user).limit(1);
      dbStatus = 'Connected';
    } catch (dbError) {
      dbStatus = `Error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
    }

    // Test auth configuration
    let authStatus = 'Unknown';
    try {
      const { auth } = await import('@/lib/auth');
      authStatus = !!auth ? 'Configured' : 'Not configured';
    } catch (authError) {
      authStatus = `Error: ${authError instanceof Error ? authError.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      status: 'Debug info',
      environment: envCheck,
      database: dbStatus,
      auth: authStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}