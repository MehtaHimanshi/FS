import mongoose, { Document, Schema } from 'mongoose';

export interface IPart extends Document {
  id: string;
  lotId: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  manufacturingDate: Date;
  supplyDate: Date;
  warrantyPeriod: string;
  warrantyExpiryDate: Date;
  qrCode?: string;
  isInstalled: boolean;
  installationData?: {
    location: string;
    section: string;
    installationDate: Date;
    installedBy: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface PartModel extends mongoose.Model<IPart> {
  generatePartId(): string;
}

const partSchema = new Schema<IPart>({
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
  partName: {
    type: String,
    required: true,
    trim: true
  },
  factoryName: {
    type: String,
    required: true,
    trim: true
  },
  lotNumber: {
    type: String,
    required: true
  },
  manufacturingDate: {
    type: Date,
    required: true
  },
  supplyDate: {
    type: Date,
    required: true
  },
  warrantyPeriod: {
    type: String,
    required: true
  },
  warrantyExpiryDate: {
    type: Date,
    required: true
  },
  qrCode: {
    type: String
  },
  isInstalled: {
    type: Boolean,
    default: false
  },
  installationData: {
    location: {
      type: String
    },
    section: {
      type: String
    },
    installationDate: {
      type: Date
    },
    installedBy: {
      type: String,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Generate part ID
partSchema.statics.generatePartId = function(): string {
  const timestamp = Date.now().toString();
  return `PART${timestamp}`;
};

// Calculate warranty expiry date before saving
partSchema.pre('save', function(next) {
  if (this.isModified('manufacturingDate') || this.isModified('warrantyPeriod')) {
    const warrantyYears = parseInt(this.warrantyPeriod.match(/\d+/)?.[0] || '0');
    this.warrantyExpiryDate = new Date(this.manufacturingDate);
    this.warrantyExpiryDate.setFullYear(this.warrantyExpiryDate.getFullYear() + warrantyYears);
  }
  next();
});

export const Part = mongoose.model<IPart, PartModel>('Part', partSchema);
export default Part;
