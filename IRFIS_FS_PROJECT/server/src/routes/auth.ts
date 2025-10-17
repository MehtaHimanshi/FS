import express from 'express';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';
import { LoginRequest, CreateUserData, ApiResponse, AuthResponse, UserRole, ROLE_CODES } from '../types';
import { Secret } from 'jsonwebtoken';
const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  userId: Joi.string().required(),
  password: Joi.string().required()
});

const createUserSchema = Joi.object({
  firstName: Joi.string().required().trim().min(2).max(50),
  lastName: Joi.string().required().trim().min(2).max(50),
  role: Joi.string().valid('admin', 'vendor', 'depot-staff', 'track-worker', 'inspector').required(),
  dateOfBirth: Joi.string().required()
});

// Generate JWT token
const generateToken = (userId: string, role?: string): string => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');
  const secret: Secret = process.env.JWT_SECRET;
  return jwt.sign({ userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};


// Generate unique user ID
const generateUserId = async (role: UserRole): Promise<string> => {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const roleCode = ROLE_CODES[role];
  
  // Find existing users with same role to get next number
  const existingUsers = await User.find({ role }).sort({ id: -1 });
  const nextNumber = String((existingUsers.length || 0) + 1).padStart(3, '0');
  
  return `${currentYear}${roleCode}${nextNumber}`;
};

// Generate default password
const generateDefaultPassword = (firstName: string, dateOfBirth: string): string => {
  return `${firstName.toLowerCase()}@${dateOfBirth}`;
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { userId, password }: LoginRequest = value;

    // Find user by ID
    const user = await User.findOne({ id: userId.toUpperCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid User ID'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      dateOfBirth: user.dateOfBirth,
      isFirstLogin: user.isFirstLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    const response: AuthResponse = {
      user: userResponse,
      token
    };

    res.json({
      success: true,
      data: response,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

// @route   POST /api/auth/create-user
// @desc    Create new user (Admin only)
// @access  Private (Admin)
router.post('/create-user', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const userData: CreateUserData = value;

    // Generate user ID
    const userId = await generateUserId(userData.role);

    // Generate default password
    const defaultPassword = generateDefaultPassword(userData.firstName, userData.dateOfBirth);

    // Create user
    const user = new User({
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      dateOfBirth: userData.dateOfBirth,
      password: defaultPassword,
      isFirstLogin: true
    });

    await user.save();

    // Remove password from response
    const userResponse = {
      _id: user._id,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      dateOfBirth: user.dateOfBirth,
      isFirstLogin: user.isFirstLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        credentials: {
          userId: user.id,
          password: defaultPassword
        }
      },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user creation'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User data retrieved successfully'
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user data'
    });
  }
});

export default router;
