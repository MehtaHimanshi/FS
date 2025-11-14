export type UserRole = 'admin' | 'vendor' | 'depot-staff' | 'track-worker' | 'inspector';

export interface User {
  _id?: string;
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth: string;
  password: string;
  isFirstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lot {
  _id?: string;
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

export interface Part {
  _id?: string;
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

export interface Inspection {
  _id?: string;
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

export interface QRCodeData {
  type: 'lot' | 'part';
  id: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  manufacturingDate: string;
  supplyDate: string;
  warrantyPeriod: string;
  createdAt: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const ROLE_NAMES = {
  'admin': 'Administrator',
  'vendor': 'Vendor',
  'depot-staff': 'Depot Staff',
  'track-worker': 'Track Worker',
  'inspector': 'Inspector'
} as const;

export const ROLE_CODES = {
  'admin': 'ADM',
  'vendor': 'VEN',
  'depot-staff': 'DEP',
  'track-worker': 'TRK',
  'inspector': 'INS'
} as const;
