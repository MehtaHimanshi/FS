// backend/models/Lot.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILot extends Document {
  id: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  supplyDate: Date;
  manufacturingDate: Date;
  warrantyPeriod: string;
  status: 'pending' | 'verified' | 'rejected';
  vendorId: string;
  qrCode?: string;
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
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  vendorId: { type: String, required: true, ref: 'User' },
  qrCode: { type: String }
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
