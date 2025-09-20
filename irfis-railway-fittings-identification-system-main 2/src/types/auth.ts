export type UserRole = 'admin' | 'vendor' | 'depot-staff' | 'track-worker' | 'inspector';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth: string;
  createdAt: string;
  isFirstLogin: boolean;
  password?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth: string;
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