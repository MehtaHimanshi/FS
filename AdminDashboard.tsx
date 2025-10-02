import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, FileText, AlertTriangle, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createUser, getAllUsers } from '@/contexts/AuthContext';
import { UserRole, ROLE_NAMES, CreateUserData } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState(getAllUsers());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  
  const [newUser, setNewUser] = useState<CreateUserData>({
    firstName: '',
    lastName: '',
    role: 'vendor',
    dateOfBirth: ''
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdUser = createUser(newUser);
      setUsers(getAllUsers());
      setNewUser({
        firstName: '',
        lastName: '',
        role: 'vendor',
        dateOfBirth: ''
      });
      setShowCreateForm(false);
      
      toast({
        title: "User Created Successfully",
        description: `User ID: ${createdUser.id} | Password: ${createdUser.password}`,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const copyCredentials = async (userId: string, password: string) => {
    const credentials = `User ID: ${userId}\nPassword: ${password}`;
    try {
      await navigator.clipboard.writeText(credentials);
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId(null), 2000);
      toast({
        title: "Credentials Copied",
        description: "User credentials copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateDefaultPassword = (firstName: string, dateOfBirth: string) => {
    return `${firstName.toLowerCase()}@${dateOfBirth}`;
  };

  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and system settings</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          Welcome, {user?.firstName}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.entries(ROLE_NAMES).map(([role, name]) => (
          <Card key={role} className="shadow-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{roleStats[role] || 0}</p>
                <p className="text-sm text-muted-foreground">{name}s</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Users</h2>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-success hover:bg-success/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <Card className="shadow-card border-success/20">
              <CardHeader>
                <CardTitle className="text-success">Create New User</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_NAMES).map(([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newUser.dateOfBirth}
                      onChange={(e) => setNewUser({...newUser, dateOfBirth: e.target.value})}
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-success hover:bg-success/90">
                      Create User
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Users List */}
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ROLE_NAMES[user.role]} • ID: {user.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.isFirstLogin ? "destructive" : "secondary"}>
                        {user.isFirstLogin ? "First Login Pending" : "Active"}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCredentials(user.id, user.password || generateDefaultPassword(user.firstName, user.dateOfBirth))}
                      >
                        {copiedUserId === user.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other Tabs - Placeholder */}
        <TabsContent value="reports">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                System Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Reports and analytics will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System alerts and notifications will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System configuration options will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
