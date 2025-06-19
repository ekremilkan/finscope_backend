// Test setup file
// Load test environment variables from .env.test file
require('dotenv').config({ path: '.env.test' });

// Global test timeout
const testTimeout = parseInt(process.env.JEST_TIMEOUT) || 30000;
jest.setTimeout(testTimeout);

// MongoDB Memory Server for testing
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set the test database URI
  process.env.DB_URI = mongoUri;
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.testUtils = {
  createTestUser: () => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPass123!'
  }),
  
  createValidJWT: () => {
    const jwt = require('jsonwebtoken');
    const config = require('../configs');
    return jwt.sign(
      { userId: 'test-user-id', userName: 'Test User' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  }
}; 