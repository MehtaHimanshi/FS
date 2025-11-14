import mongoose from 'mongoose';
import { User } from '../models/User';
import { Lot } from '../models/Lot';
import dotenv from 'dotenv';

dotenv.config();

interface AuditEntry {
  timestamp: Date;
  actorId: string;
  actorName: string;
  action: string;
  details?: string;
  metadata?: Record<string, any>;
}

interface UserHistoryEntry {
  timestamp: Date;
  action: string;
  targetType: 'lot' | 'part' | 'inspection' | 'installation';
  targetId: string;
  details?: string;
  metadata?: Record<string, any>;
}

// Add audit trail and history fields to schemas
const addAuditFields = async () => {
  try {
    console.log('🔄 Starting database migration: Adding audit trails and user history...');

    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/irfis';
    await mongoose.connect(mongoURI);
    console.log('📊 Connected to MongoDB');

    // Update User schema to add history field
    const userSchema = mongoose.model('User').schema;
    if (!userSchema.paths.history) {
      userSchema.add({
        history: [{
          timestamp: { type: Date, default: Date.now },
          action: { type: String, required: true },
          targetType: { type: String, enum: ['lot', 'part', 'inspection', 'installation'], required: true },
          targetId: { type: String, required: true },
          details: { type: String },
          metadata: { type: mongoose.Schema.Types.Mixed }
        }]
      });
      console.log('✅ Added history field to User schema');
    }

    // Update Lot schema to add auditTrail field
    const lotSchema = mongoose.model('Lot').schema;
    if (!lotSchema.paths.auditTrail) {
      lotSchema.add({
        auditTrail: [{
          timestamp: { type: Date, default: Date.now },
          actorId: { type: String, required: true },
          actorName: { type: String, required: true },
          action: { type: String, required: true },
          details: { type: String },
          metadata: { type: mongoose.Schema.Types.Mixed }
        }],
        qrTokens: [{
          token: { type: String, required: true },
          generatedAt: { type: Date, default: Date.now },
          expiresAt: { type: Date, required: true },
          generatedBy: { type: String, required: true }
        }]
      });
      console.log('✅ Added auditTrail and qrTokens fields to Lot schema');
    }

    // Backfill existing documents with empty arrays
    const usersUpdated = await User.updateMany(
      { history: { $exists: false } },
      { $set: { history: [] } }
    );
    console.log(`✅ Backfilled ${usersUpdated.modifiedCount} users with empty history arrays`);

    const lotsUpdated = await Lot.updateMany(
      { auditTrail: { $exists: false } },
      { $set: { auditTrail: [], qrTokens: [] } }
    );
    console.log(`✅ Backfilled ${lotsUpdated.modifiedCount} lots with empty auditTrail and qrTokens arrays`);

    // Create indexes for better performance
    await Lot.collection.createIndex({ 'auditTrail.timestamp': 1 });
    await Lot.collection.createIndex({ 'qrTokens.token': 1 });
    await Lot.collection.createIndex({ 'qrTokens.expiresAt': 1 });
    await User.collection.createIndex({ 'history.timestamp': 1 });
    console.log('✅ Created performance indexes');

    console.log('🎉 Database migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('=====================================');
    console.log(`✅ Users updated: ${usersUpdated.modifiedCount}`);
    console.log(`✅ Lots updated: ${lotsUpdated.modifiedCount}`);
    console.log('✅ Added auditTrail field to lots');
    console.log('✅ Added history field to users');
    console.log('✅ Added qrTokens field to lots');
    console.log('✅ Created performance indexes');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
addAuditFields();
