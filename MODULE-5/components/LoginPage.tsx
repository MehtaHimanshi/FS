import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Train, Shield, QrCode, Users, Wrench, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_NAMES } from '@/types/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) return;

    setIsLoading(true);
    const success = await login(userId, password);
    if (success) {
      onLoginSuccess();
    }
    setIsLoading(false);
  };

  const roleIcons = {
    admin: Shield,
    vendor: Users,
    'depot-staff': Wrench,
    'track-worker': Train,
    inspector: Search
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center text-white">
          <div className="flex items-center justify-center mb-4">
            <Train className="h-12 w-12 mr-3" />
            <QrCode className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Indian Railways</h1>
          <h2 className="text-xl font-medium mb-1">Fittings Identification System</h2>
          <p className="text-primary-light text-sm">(IRFIS)</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center pb-4">
            <h3 className="text-2xl font-semibold text-primary">System Login</h3>
            <p className="text-muted-foreground">Select your role and enter credentials</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_NAMES).map(([key, name]) => {
                      const Icon = roleIcons[key as UserRole];
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* User ID */}
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="Enter your User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark"
                disabled={!userId || !password || isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p className="mb-2">Default Password Format: <span className="font-mono">firstname@DOB</span></p>
              <p>Contact System Administrator for User ID</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;