// frontend/src/components/VendorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, QrCode, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import QrModal from '@/components/QrModal';

interface LotItem {
  _id?: string;
  id?: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  supplyDate: string;
  manufacturingDate: string;
  warrantyPeriod: string;
  status: 'pending' | 'verified' | 'rejected' | 'accepted' | 'held';
  createdAt: string;
  qrCode?: string;
}

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [lots, setLots] = useState<LotItem[]>([]);
  const [newLot, setNewLot] = useState({
    partName: '',
    factoryName: '',
    lotNumber: '',
    supplyDate: '',
    manufacturingDate: '',
    warrantyPeriod: ''
  });
  
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [qrImageData, setQrImageData] = useState<string>('');

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await apiService.getLots();
        if (response.success && response.data && typeof response.data === 'object' && 'lots' in response.data) {
          setLots((response.data as any).lots || []);
        }
      } catch (err: any) {
        console.error('fetchLots error:', err);
        toast({ title: 'Error', description: err.message || 'Could not load lots', variant: 'destructive' });
      }
    };

    fetchLots();
  }, []);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await apiService.createLot(newLot);
      if (response.success && response.data) {
        // Refresh lots list
        const lotsResponse = await apiService.getLots();
        if (lotsResponse.success && lotsResponse.data && typeof lotsResponse.data === 'object' && 'lots' in lotsResponse.data) {
          setLots((lotsResponse.data as any).lots || []);
        }

        // reset form
        setNewLot({ partName: '', factoryName: '', lotNumber: '', supplyDate: '', manufacturingDate: '', warrantyPeriod: '' });

        toast({ title: 'Lot Created', description: `Lot ${(response.data as any).lotNumber ?? (response.data as any).id} created successfully` });
      }
    } catch (err: any) {
      console.error('create lot error:', err);
      toast({ title: 'Error', description: err.message || 'Could not create lot', variant: 'destructive' });
    }
  };

  const generateQRCode = async (lotId?: string) => {
    if (!lotId) {
      toast({ title: 'No ID', description: 'This lot has no ID for QR generation', variant: 'destructive' });
      return;
    }

    try {
      const response = await apiService.generateQRCode('lot', lotId);
      if (response.success && response.data) {
        setQrData((response.data as any).qrData);
        setQrImageData((response.data as any).qrCode);
        setQrModalOpen(true);
        
        toast({ 
          title: 'QR Code Generated', 
          description: `QR code generated for lot ${lotId}` 
        });
      }
    } catch (err: any) {
      console.error('generateQRCode error:', err);
      toast({ title: 'Error', description: err.message || 'Could not generate QR code', variant: 'destructive' });
    }
  };


  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    verified: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground',
    accepted: 'bg-success text-success-foreground',
    held: 'bg-secondary text-secondary-foreground'
  };

  const statusIcons: Record<string, any> = {
    pending: Clock,
    verified: CheckCircle,
    rejected: XCircle,
    accepted: CheckCircle,
    held: Clock
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage lots and fittings marking</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          {user?.firstName} {user?.lastName}
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{lots.length}</p>
              <p className="text-sm text-muted-foreground">Total Lots</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{lots.filter(l => l.status === 'pending').length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{lots.filter(l => l.status === 'verified').length}</p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{lots.filter(l => l.status === 'rejected').length}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{lots.filter(l => l.status === 'accepted').length}</p>
            <p className="text-sm text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{lots.filter(l => l.status === 'held').length}</p>
            <p className="text-sm text-muted-foreground">Held</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create New Lot</TabsTrigger>
          <TabsTrigger value="manage">Manage Lots</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" /> Add New Service / Marking Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLot} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partName">Part Name *</Label>
                  <Input id="partName" value={newLot.partName} onChange={(e) => setNewLot({ ...newLot, partName: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="factoryName">Factory / Supplier Name *</Label>
                  <Input id="factoryName" value={newLot.factoryName} onChange={(e) => setNewLot({ ...newLot, factoryName: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lotNumber">Lot Number / Box Number *</Label>
                  <Input id="lotNumber" value={newLot.lotNumber} onChange={(e) => setNewLot({ ...newLot, lotNumber: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplyDate">Supply Date *</Label>
                  <Input id="supplyDate" type="date" value={newLot.supplyDate} onChange={(e) => setNewLot({ ...newLot, supplyDate: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturingDate">Manufacturing Date *</Label>
                  <Input id="manufacturingDate" type="date" value={newLot.manufacturingDate} onChange={(e) => setNewLot({ ...newLot, manufacturingDate: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyPeriod">Warranty Period *</Label>
                  <Input id="warrantyPeriod" value={newLot.warrantyPeriod} onChange={(e) => setNewLot({ ...newLot, warrantyPeriod: e.target.value })} required />
                </div>

                <div className="md:col-span-2 flex justify-end space-x-2 pt-4">
                  <Button type="submit" className="bg-success hover:bg-success/90">
                    <QrCode className="h-4 w-4 mr-2" /> Create Lot & Generate QR
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Lots</h2>
          </div>

          <div className="grid gap-4">
            {lots.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Lots Created</h3>
                  <p className="text-muted-foreground">Create your first lot to get started</p>
                </CardContent>
              </Card>
            ) : (
              lots.map((lot) => {
                const StatusIcon = statusIcons[lot.status];
                const lotId = lot.id; // Use the custom lot ID, not MongoDB _id
                return (
                  <Card key={lot._id ?? lot.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{lot.partName}</h3>
                          <p className="text-sm text-muted-foreground">Lot: {lot.lotNumber} • Factory: {lot.factoryName}</p>
                          <p className="text-xs text-muted-foreground">Supply Date: {new Date(lot.supplyDate).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">Lot ID: {lotId}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge className={statusColors[lot.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                          </Badge>

                          {lotId ? (
                            <Button variant="outline" size="sm" onClick={() => generateQRCode(lotId)}>
                              <QrCode className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>


        <TabsContent value="reports">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Vendor Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed reports and analytics will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Modal */}
      <QrModal 
        open={qrModalOpen} 
        onOpenChange={setQrModalOpen}
        qrData={qrData}
        qrImageData={qrImageData}
      />
    </div>
  );
};

export default VendorDashboard;
