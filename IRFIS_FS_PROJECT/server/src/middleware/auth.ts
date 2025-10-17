import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ApiResponse, UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    dateOfBirth: string;
    isFirstLogin: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const authenticate = async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; role?: string };
    const user = await User.findOne({ id: decoded.userId }).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user.toObject();
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`Access denied for user ${req.user.id} (${req.user.role}). Required roles: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}.`
      });
    }

    next();
  };
};
