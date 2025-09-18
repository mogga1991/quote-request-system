// Test setup file
// This file runs before all tests to set up the testing environment

import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Ensure Anthropic API key is available for tests
if (!process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-test-key-for-development-only';
}

// For now, we're only testing schema structure without database connections
// Future versions will include database setup and teardown