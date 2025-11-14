import mongoose, { Document, Schema } from 'mongoose';

export interface IReplacementRequest extends Document {
  id: string;
  lotId: string;
  partId?: string;
  requestedBy: string; // User ID who requested
  requestedByRole: 'track-worker' | 'inspector';
  reason: string;
  description: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reviewedBy?: string; // Admin/Depot Staff ID
  reviewedAt?: Date;
  reviewNotes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

export interface IReplacementRequestModel extends mongoose.Model<IReplacementRequest> {
  generateReplacementRequestId(): string;
}

const replacementRequestSchema = new Schema<IReplacementRequest>({
  id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  lotId: {
    type: String,
    required: true,
    ref: 'Lot'
  },
  partId: {
    type: String,
    ref: 'Part'
  },
  requestedBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  requestedByRole: {
    type: String,
    required: true,
    enum: ['track-worker', 'inspector']
  },
  reason: {
    type: String,
    required: true,
    enum: ['defective', 'damaged', 'worn', 'expired', 'incorrect_spec', 'other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  photos: [{
    type: String // Array of photo filenames
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Generate replacement request ID
replacementRequestSchema.statics.generateReplacementRequestId = function (): string {
  const timestamp = Date.now().toString();
  return `REQ${timestamp}`;
};

// Indexes for better performance
replacementRequestSchema.index({ lotId: 1 });
replacementRequestSchema.index({ requestedBy: 1 });
replacementRequestSchema.index({ status: 1 });
replacementRequestSchema.index({ createdAt: -1 });

export const ReplacementRequest = mongoose.model<IReplacementRequest, IReplacementRequestModel>('ReplacementRequest', replacementRequestSchema);
export default ReplacementRequest;
