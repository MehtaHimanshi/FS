import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, UserRole, ROLE_CODES, CreateUserData } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Generate unique user ID in YYROLENUMBERS format
const generateUserId = (role: UserRole, year: string): string => {
  const roleCode = ROLE_CODES[role];
  const existingUsers = JSON.parse(localStorage.getItem('irfis-users') || '[]');
  const roleUsers = existingUsers.filter((u: User) => u.role === role);
  const nextNumber = String(roleUsers.length + 1).padStart(3, '0');
  return `${year}${roleCode}${nextNumber}`;
};

// Generate default password: firstname@DOB
const generateDefaultPassword = (firstName: string, dateOfBirth: string): string => {
  return `${firstName.toLowerCase()}@${dateOfBirth}`;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a token and try to get current user
        const token = localStorage.getItem('irfis-token');
        if (token) {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        // Token is invalid or expired, clear it
        apiService.clearToken();
        localStorage.removeItem('irfis-current-user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const authResponse = await apiService.login(userId, password);
      setUser(authResponse.user);
      localStorage.setItem('irfis-current-user', JSON.stringify(authResponse.user));
      
      toast({
        title: "Login Successful",
        description: `Welcome ${authResponse.user.firstName} ${authResponse.user.lastName}`,
      });

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiService.clearToken();
    localStorage.removeItem('irfis-current-user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await apiService.changePassword(oldPassword, newPassword);
      
      // Update user state to reflect password change
      const updatedUser = { ...user, isFirstLogin: false };
      setUser(updatedUser);
      localStorage.setItem('irfis-current-user', JSON.stringify(updatedUser));

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated",
      });

      return true;
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Password Change Failed",
        description: error.message || "An error occurred while changing password",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      changePassword,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Admin function to create new user
export const createUser = (userData: CreateUserData): User => {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const userId = generateUserId(userData.role, currentYear);
  
  const newUser: User = {
    id: userId,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    dateOfBirth: userData.dateOfBirth,
    createdAt: new Date().toISOString(),
    isFirstLogin: true,
    password: generateDefaultPassword(userData.firstName, userData.dateOfBirth)
  };

  const users: User[] = JSON.parse(localStorage.getItem('irfis-users') || '[]');
  users.push(newUser);
  localStorage.setItem('irfis-users', JSON.stringify(users));

  return newUser;
};

// Get all users (admin only)
export const getAllUsers = (): User[] => {
  return JSON.parse(localStorage.getItem('irfis-users') || '[]');
};