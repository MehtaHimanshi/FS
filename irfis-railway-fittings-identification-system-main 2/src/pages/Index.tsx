import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import VendorDashboard from '@/components/vendor/VendorDashboard';
import DepotDashboard from '@/components/depot/DepotDashboard';
import TrackWorkerDashboard from '@/components/trackworker/TrackWorkerDashboard';
import InspectorDashboard from '@/components/inspector/InspectorDashboard';
import PasswordChangeDialog from '@/components/PasswordChangeDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Lock, Train, QrCode } from 'lucide-react';

const Index = () => {
  const { user, logout, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setShowLogin(false);
    } else {
      setShowLogin(true);
    }
  }, [user]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleLogout = () => {
    logout();
    setShowLogin(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <Card className="shadow-elevated">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Train className="h-8 w-8 mr-2 text-primary animate-pulse" />
              <QrCode className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">Loading IRFIS...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showLogin || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'vendor':
        return <VendorDashboard />;
      case 'depot-staff':
        return <DepotDashboard />;
      case 'track-worker':
        return <TrackWorkerDashboard />;
      case 'inspector':
        return <InspectorDashboard />;
      default:
        return (
          <div className="p-6">
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Unknown Role</h2>
                <p className="text-muted-foreground">Your role is not recognized in the system.</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary border-b shadow-government">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Train className="h-8 w-8 text-white" />
            <QrCode className="h-6 w-6 text-white" />
            <div className="text-white">
              <h1 className="font-bold text-lg">Indian Railways IRFIS</h1>
              <p className="text-sm text-primary-light">Fittings Identification System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {user.firstName} {user.lastName}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswordDialog(true)}
              className="text-white hover:bg-white/10"
            >
              <Lock className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderDashboard()}
      </main>

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </div>
  );
};

export default Index;
