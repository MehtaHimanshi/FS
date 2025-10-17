import mongoose, { Document, Schema } from 'mongoose';

export interface IInspection extends Document {
  id: string;
  partId: string;
  inspectorId: string;
  condition: 'good' | 'worn' | 'replace';
  notes?: string;
  photos: string[];
  inspectionDate: Date;
  nextInspectionDue?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inspectionSchema = new Schema<IInspection>({
  id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  partId: {
    type: String,
    required: true,
    ref: 'Part'
  },
  inspectorId: {
    type: String,
    required: true,
    ref: 'User'
  },
  condition: {
    type: String,
    required: true,
    enum: ['good', 'worn', 'replace']
  },
  notes: {
    type: String,
    trim: true
  },
  photos: [{
    type: String
  }],
  inspectionDate: {
    type: Date,
    default: Date.now
  },
  nextInspectionDue: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate inspection ID
inspectionSchema.statics.generateInspectionId = function(): string {
  const timestamp = Date.now().toString();
  return `INS${timestamp}`;
};

// Calculate next inspection due date based on condition
inspectionSchema.pre('save', function(next) {
  if (this.isModified('condition')) {
    const now = new Date();
    switch (this.condition) {
      case 'good':
        this.nextInspectionDue = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)); // 6 months
        break;
      case 'worn':
        this.nextInspectionDue = new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)); // 3 months
        break;
      case 'replace':
        this.nextInspectionDue = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 1 month
        break;
    }
  }
  next();
});

export const Inspection = mongoose.model<IInspection>('Inspection', inspectionSchema);
