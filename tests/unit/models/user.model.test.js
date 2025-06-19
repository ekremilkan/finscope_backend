const User = require('../../../models/user.model');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser._id).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePass123!'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await bcrypt.compare(userData.password, user.password);
      expect(isMatch).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const userData = {
        name: 'Invalid User',
        email: 'invalid-email',
        password: 'SecurePass123!'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail with weak password', async () => {
      const userData = {
        name: 'Weak Pass User',
        email: 'weak@example.com',
        password: '123' // Too weak
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'SecurePass123!'
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User({
        ...userData,
        name: 'Second User'
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!'
      });
      await user.save();
    });

    describe('generateAccessToken', () => {
      it('should generate valid JWT token', () => {
        const token = user.generateAccessToken();
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(user.accessToken).toBe(token);
        expect(user.tokenCreatedAt).toBeDefined();
      });
    });

    describe('clearAccessToken', () => {
      it('should clear access token', () => {
        user.generateAccessToken();
        expect(user.accessToken).toBeDefined();

        user.clearAccessToken();
        expect(user.accessToken).toBeNull();
        expect(user.tokenCreatedAt).toBeNull();
      });
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const isMatch = await user.comparePassword('SecurePass123!');
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isMatch = await user.comparePassword('WrongPassword');
        expect(isMatch).toBe(false);
      });
    });

    describe('Account Locking', () => {
      it('should increment login attempts', async () => {
        const initialAttempts = user.loginAttempts || 0;
        await user.incLoginAttempts();
        
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.loginAttempts).toBe(initialAttempts + 1);
      });

      it('should lock account after 5 failed attempts', async () => {
        // Set login attempts to 4
        user.loginAttempts = 4;
        await user.save();

        // This should lock the account
        await user.incLoginAttempts();
        
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.lockUntil).toBeDefined();
        expect(updatedUser.isLocked).toBe(true);
      });

      it('should reset login attempts on successful login', async () => {
        user.loginAttempts = 3;
        await user.save();

        await user.resetLoginAttempts();
        
        const updatedUser = await User.findById(user._id);
        // After reset, loginAttempts should be 0 or undefined
        expect(updatedUser.loginAttempts).toBeFalsy();
        expect(updatedUser.lockUntil).toBeUndefined();
      });
    });
  });

  describe('User Schema Validation', () => {
    it('should require name field', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require email field', async () => {
      const user = new User({
        name: 'Test User',
        password: 'SecurePass123!'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password field', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should validate name pattern', async () => {
      const user = new User({
        name: 'Test123', // Invalid: contains numbers
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });
}); 