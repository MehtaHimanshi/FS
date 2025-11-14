// backend/models/Lot.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface AuditEntry {
  timestamp: Date;
  actorId: string;
  actorName: string;
  action: string;
  details?: string;
  metadata?: Record<string, any>;
}

export interface QrToken {
  token: string;
  generatedAt: Date;
  expiresAt: Date;
  generatedBy: string;
}

export interface ILot extends Document {
  id: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  supplyDate: Date;
  manufacturingDate: Date;
  warrantyPeriod: string;
  status: 'pending' | 'verified' | 'rejected' | 'accepted' | 'held';
  vendorId: string;
  qrCode?: string; // Keep for backward compatibility, but will be deprecated
  auditTrail: AuditEntry[];
  qrTokens: QrToken[];
  createdAt: Date;
  updatedAt: Date;
}

interface LotModel extends Model<ILot> {
  generateLotId(): string;
}

const lotSchema = new Schema<ILot>({
  id: { type: String, required: true, unique: true, uppercase: true },
  partName: { type: String, required: true, trim: true },
  factoryName: { type: String, required: true, trim: true },
  lotNumber: { type: String, required: true, trim: true, unique: true },
  supplyDate: { type: Date, required: true },
  manufacturingDate: { type: Date, required: true },
  warrantyPeriod: { type: String, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected', 'accepted', 'held'], default: 'pending' },
  vendorId: { type: String, required: true, ref: 'User' },
  qrCode: { type: String }, // Deprecated - keeping for backward compatibility
  auditTrail: [{
    timestamp: { type: Date, default: Date.now },
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String },
    metadata: { type: Schema.Types.Mixed }
  }],
  qrTokens: [{
    token: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    generatedBy: { type: String, required: true }
  }]
}, {
  timestamps: true
});

// static to generate lot id
lotSchema.statics.generateLotId = function (): string {
  const timestamp = Date.now().toString();
  return `LOT${timestamp}`;
};

export const Lot = mongoose.model<ILot, LotModel>('Lot', lotSchema);
export default Lot;
