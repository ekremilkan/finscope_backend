const userService = require('../../../services/user.service');
const User = require('../../../models/user.model');
const { StatusCodes } = require('http-status-codes');

// Mock User model
jest.mock('../../../models/user.model');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockReq = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      }
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        name: 'John Doe',
        email: 'john@example.com',
        save: jest.fn().mockResolvedValue(),
        generateAccessToken: jest.fn().mockReturnValue('mock-token'),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user-id',
          name: 'John Doe',
          email: 'john@example.com'
        })
      };

      User.findOne.mockResolvedValue(null); // Email doesn't exist
      User.mockImplementation(() => mockUser);

      const result = await userService.register(mockReq);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockUser.save).toHaveBeenCalledTimes(2); // Once for user, once for token
      expect(mockUser.generateAccessToken).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          _id: 'user-id',
          name: 'John Doe',
          email: 'john@example.com'
        },
        token: 'mock-token'
      });
    });

    it('should throw error if email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'john@example.com' }); // Email exists

      await expect(userService.register(mockReq)).rejects.toMatchObject({
        message: 'Bu email adresi zaten kullanımda.',
        statusCode: StatusCodes.BAD_REQUEST
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });
  });

  describe('login', () => {
    const mockReq = {
      body: {
        email: 'john@example.com',
        password: 'SecurePass123!'
      }
    };

    it('should login user successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'john@example.com',
        isLocked: false,
        loginAttempts: 0,
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn().mockResolvedValue(),
        generateAccessToken: jest.fn().mockReturnValue('mock-token'),
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user-id',
          email: 'john@example.com'
        })
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await userService.login(mockReq);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('SecurePass123!');
      expect(mockUser.generateAccessToken).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          _id: 'user-id',
          email: 'john@example.com'
        },
        token: 'mock-token'
      });
    });

    it('should throw error if user not found', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await expect(userService.login(mockReq)).rejects.toMatchObject({
        message: 'Geçersiz e-posta veya şifre.',
        statusCode: StatusCodes.UNAUTHORIZED
      });
    });

    it('should throw error if account is locked', async () => {
      const mockUser = {
        isLocked: true
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(userService.login(mockReq)).rejects.toMatchObject({
        message: 'Hesap geçici olarak kilitlenmiştir. Lütfen daha sonra tekrar deneyin.',
        statusCode: StatusCodes.LOCKED
      });
    });

    it('should throw error and increment login attempts on wrong password', async () => {
      const mockUser = {
        isLocked: false,
        comparePassword: jest.fn().mockResolvedValue(false),
        incLoginAttempts: jest.fn().mockResolvedValue()
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(userService.login(mockReq)).rejects.toMatchObject({
        message: 'Geçersiz e-posta veya şifre.',
        statusCode: StatusCodes.UNAUTHORIZED
      });

      expect(mockUser.incLoginAttempts).toHaveBeenCalled();
    });

    it('should reset login attempts on successful login', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'john@example.com',
        isLocked: false,
        loginAttempts: 2, // Has previous failed attempts
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn().mockResolvedValue(),
        generateAccessToken: jest.fn().mockReturnValue('mock-token'),
        save: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user-id',
          email: 'john@example.com'
        })
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await userService.login(mockReq);

      expect(mockUser.resetLoginAttempts).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockUser = {
        clearAccessToken: jest.fn(),
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await userService.logout('user-id');

      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(mockUser.clearAccessToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Başarıyla çıkış yapıldı' });
    });

    it('should handle logout when user not found', async () => {
      User.findById.mockResolvedValue(null);

      const result = await userService.logout('non-existent-id');

      expect(result).toEqual({ message: 'Başarıyla çıkış yapıldı' });
    });
  });
}); 