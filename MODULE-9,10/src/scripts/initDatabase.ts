import mongoose from 'mongoose';
import { User } from '../models/User';
import { ROLE_CODES } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const generateUserId = (role: string, year: string, number: number): string => {
  const roleCode = ROLE_CODES[role as keyof typeof ROLE_CODES];
  const paddedNumber = String(number).padStart(3, '0');
  return `${year}${roleCode}${paddedNumber}`;
};

const generateDefaultPassword = (firstName: string, dateOfBirth: string): string => {
  return `${firstName.toLowerCase()}@${dateOfBirth}`;
};

const sampleUsers = [
  {
    id: '24ADM001',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    dateOfBirth: '1970-01-01',
    password: 'admin123'
  },
  {
    id: '24VEN001',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    role: 'vendor',
    dateOfBirth: '1985-03-15',
    password: 'rajesh@1985-03-15'
  },
  {
    id: '24DEP001',
    firstName: 'Priya',
    lastName: 'Singh',
    role: 'depot-staff',
    dateOfBirth: '1988-07-22',
    password: 'priya@1988-07-22'
  },
  {
    id: '24TRK001',
    firstName: 'Amit',
    lastName: 'Kumar',
    role: 'track-worker',
    dateOfBirth: '1990-12-05',
    password: 'amit@1990-12-05'
  },
  {
    id: '24INS001',
    firstName: 'Sunita',
    lastName: 'Patel',
    role: 'inspector',
    dateOfBirth: '1982-09-18',
    password: 'sunita@1982-09-18'
  }
];

const initDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/irfis';
    await mongoose.connect(mongoURI);
    console.log('📊 Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Create sample users
    for (const userData of sampleUsers) {
      const user = new User({
        ...userData,
        isFirstLogin: false
      });
      await user.save();
      console.log(`✅ Created user: ${userData.id} - ${userData.firstName} ${userData.lastName}`);
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📋 Sample User Credentials:');
    console.log('=====================================');
    
    sampleUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.id} | ${user.password}`);
    });
    
    console.log('=====================================');
    console.log('\n🚀 You can now start the server and test the API!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run initialization
initDatabase();
