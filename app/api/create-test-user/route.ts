import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, 'test@example.com'))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists',
        credentials: {
          email: 'test@example.com',
          password: 'password123',
        },
      });
    }

    // Create test user
    const testUserId = nanoid();
    const testUser = {
      id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(user).values(testUser);

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      credentials: {
        email: 'test@example.com',
        password: 'password123',
      },
      userId: testUserId,
    });

  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create test user'
    }, { status: 500 });
  }
}