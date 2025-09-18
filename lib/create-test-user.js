// Simple script to create test user via sign-up API
const createTestUser = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
    });

    const result = await response.json();
    console.log('Test user creation result:', result);
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createTestUser();
}

module.exports = { createTestUser };