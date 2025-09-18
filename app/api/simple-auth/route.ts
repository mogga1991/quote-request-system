import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple test authentication without database dependency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    // Simple hardcoded test credentials
    const testCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    if (action === 'signin') {
      if (email === testCredentials.email && password === testCredentials.password) {
        // Set a simple session cookie
        const response = NextResponse.json({
          success: true,
          user: {
            id: 'test-user-id',
            email: testCredentials.email,
            name: 'Test User'
          }
        });

        response.cookies.set('simple-auth-session', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid credentials'
        }, { status: 401 });
      }
    }

    if (action === 'signout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('simple-auth-session');
      return response;
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}

// Check authentication status
export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('simple-auth-session');

    if (session?.value === 'authenticated') {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      });
    }

    return NextResponse.json({
      authenticated: false
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Server error'
    }, { status: 500 });
  }
}