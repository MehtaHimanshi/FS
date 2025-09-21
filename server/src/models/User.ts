import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, ROLE_CODES } from '../types';

export interface UserHistoryEntry {
  timestamp: Date;
  action: string;
  targetType: 'lot' | 'part' | 'inspection' | 'installation';
  targetId: string;
  details?: string;
  metadata?: Record<string, any>;
}

export interface IUser extends Document {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth: string;
  password: string;
  isFirstLogin: boolean;
  history: UserHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'vendor', 'depot-staff', 'track-worker', 'inspector']
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  history: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    targetType: { type: String, enum: ['lot', 'part', 'inspection', 'installation'], required: true },
    targetId: { type: String, required: true },
    details: { type: String },
    metadata: { type: Schema.Types.Mixed }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate user ID
userSchema.statics.generateUserId = function(role: UserRole): string {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const roleCode = ROLE_CODES[role];
  const timestamp = Date.now().toString().slice(-3);
  return `${currentYear}${roleCode}${timestamp}`;
};

// Generate default password
userSchema.statics.generateDefaultPassword = function(firstName: string, dateOfBirth: string): string {
  return `${firstName.toLowerCase()}@${dateOfBirth}`;
};

export const User = mongoose.model<IUser>('User', userSchema);
