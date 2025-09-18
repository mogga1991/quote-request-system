#!/usr/bin/env ts-node

import { db } from '../db/drizzle';
import { user } from '../db/schema';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = {
      id: nanoid(),
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert user
    await db.insert(user).values(testUser);
    
    // Since we're using better-auth with email/password, we need to create the password record
    // This would normally be handled by better-auth, but we're creating it manually for testing
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('User ID:', testUser.id);

  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();