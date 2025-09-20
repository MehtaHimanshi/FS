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

interface LotItem {
  _id?: string;
  id?: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  supplyDate: string;
  manufacturingDate: string;
  warrantyPeriod: string;
  status: 'pending' | 'verified' | 'rejected';
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
  
  const [selectedLotForParts, setSelectedLotForParts] = useState<string>('');
  const [partsQuantity, setPartsQuantity] = useState<number>(1);
  const [generatingParts, setGeneratingParts] = useState(false);

  // helper: safe JSON parse for responses
  const parseResponse = async (res: Response) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return { raw: text };
    }
  };

  useEffect(() => {
    if (!user?.token) return;

    const fetchLots = async () => {
      try {
        const res = await fetch('/api/lots', {
          headers: { Authorization: `Bearer ${user?.token}` }
        });

        const payload = await parseResponse(res);

        if (!res.ok) {
          const message = payload?.message || payload?.raw || res.statusText || 'Failed to load lots';
          throw new Error(message);
        }

        // backend returns { success: true, data: { lots, pagination } }
        const lotsData = payload?.data?.lots ?? payload?.data ?? [];
        setLots(lotsData);
      } catch (err: any) {
        console.error('fetchLots error:', err);
        toast({ title: 'Error', description: err.message || 'Could not load lots', variant: 'destructive' });
      }
    };

    fetchLots();
  }, [user?.token]);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      toast({ title: 'Not authenticated', description: 'Please login to create lots', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify(newLot)
      });

      const payload = await parseResponse(res);

      if (!res.ok) {
        const message = payload?.message || payload?.raw || res.statusText || 'Failed to create lot';
        throw new Error(message);
      }

      const created = payload?.data ?? payload;
      // add at top
      setLots(prev => [created, ...prev]);

      // reset form
      setNewLot({ partName: '', factoryName: '', lotNumber: '', supplyDate: '', manufacturingDate: '', warrantyPeriod: '' });

      toast({ title: 'Lot Created', description: `Lot ${created.lotNumber ?? created.id} created successfully` });
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

    if (!user?.token) {
      toast({ title: 'Not authenticated', description: 'Please login to generate QR codes', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ type: 'lot', id: lotId })
      });

      const payload = await parseResponse(res);

      if (!res.ok) {
        const message = payload?.message || payload?.raw || res.statusText || 'Failed to generate QR code';
        throw new Error(message);
      }

      const qrData = payload?.data;
      
      // Update the lot in the local state with the QR code
      setLots(prev => prev.map(lot => 
        (lot._id === lotId || lot.id === lotId) 
          ? { ...lot, qrCode: qrData?.qrCode }
          : lot
      ));

      toast({ 
        title: 'QR Code Generated', 
        description: `QR code generated for lot ${lotId}` 
      });

      // Optionally open QR code in new window or download
      if (qrData?.qrCode) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>QR Code - ${lotId}</title></head>
              <body style="text-align: center; padding: 20px;">
                <h2>QR Code for Lot: ${lotId}</h2>
                <img src="${qrData.qrCode}" alt="QR Code" style="max-width: 100%; height: auto;" />
                <p><strong>Part:</strong> ${qrData.qrData?.partName}</p>
                <p><strong>Factory:</strong> ${qrData.qrData?.factoryName}</p>
                <p><strong>Lot Number:</strong> ${qrData.qrData?.lotNumber}</p>
              </body>
            </html>
          `);
        }
      }
    } catch (err: any) {
      console.error('generateQRCode error:', err);
      toast({ title: 'Error', description: err.message || 'Could not generate QR code', variant: 'destructive' });
    }
  };

  const generatePartsFromLot = async () => {
    if (!selectedLotForParts || partsQuantity <= 0) {
      toast({ title: 'Invalid Input', description: 'Please select a lot and enter a valid quantity', variant: 'destructive' });
      return;
    }

    if (!user?.token) {
      toast({ title: 'Not authenticated', description: 'Please login to generate parts', variant: 'destructive' });
      return;
    }

    setGeneratingParts(true);
    try {
      const res = await fetch(`/api/lots/${selectedLotForParts}/generate-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ quantity: partsQuantity })
      });

      const payload = await parseResponse(res);

      if (!res.ok) {
        const message = payload?.message || payload?.raw || res.statusText || 'Failed to generate parts';
        throw new Error(message);
      }

      const data = payload?.data;
      toast({ 
        title: 'Parts Generated', 
        description: `Successfully generated ${data?.count || partsQuantity} parts from lot ${selectedLotForParts}` 
      });

      // Reset form
      setSelectedLotForParts('');
      setPartsQuantity(1);
    } catch (err: any) {
      console.error('generatePartsFromLot error:', err);
      toast({ title: 'Error', description: err.message || 'Could not generate parts', variant: 'destructive' });
    } finally {
      setGeneratingParts(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    verified: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground'
  };

  const statusIcons: Record<string, any> = {
    pending: Clock,
    verified: CheckCircle,
    rejected: XCircle
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create New Lot</TabsTrigger>
          <TabsTrigger value="manage">Manage Lots</TabsTrigger>
          <TabsTrigger value="parts">Generate Parts</TabsTrigger>
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
                const id = lot._id ?? lot.id;
                return (
                  <Card key={id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{lot.partName}</h3>
                          <p className="text-sm text-muted-foreground">Lot: {lot.lotNumber} • Factory: {lot.factoryName}</p>
                          <p className="text-xs text-muted-foreground">Supply Date: {new Date(lot.supplyDate).toLocaleDateString()}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge className={statusColors[lot.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                          </Badge>

                          {id ? (
                            <Button variant="outline" size="sm" onClick={() => generateQRCode(id)}>
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

        <TabsContent value="parts" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" /> Generate Parts from Lot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lotSelect">Select Lot *</Label>
                  <select 
                    id="lotSelect"
                    value={selectedLotForParts} 
                    onChange={(e) => setSelectedLotForParts(e.target.value)}
                    className="w-full p-2 border border-input bg-background rounded-md"
                    required
                  >
                    <option value="">Choose a lot...</option>
                    {lots.filter(lot => lot.status === 'verified' || lot.status === 'pending').map((lot) => {
                      const id = lot._id ?? lot.id;
                      return (
                        <option key={id} value={id}>
                          {lot.lotNumber} - {lot.partName} ({lot.status})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Parts to Generate *</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1" 
                    max="1000"
                    value={partsQuantity} 
                    onChange={(e) => setPartsQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                    required 
                  />
                  <p className="text-sm text-muted-foreground">Maximum 1000 parts per generation</p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    onClick={generatePartsFromLot}
                    disabled={!selectedLotForParts || partsQuantity <= 0 || generatingParts}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {generatingParts ? 'Generating...' : 'Generate Parts'}
                    <Package className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {lots.filter(lot => lot.status === 'verified' || lot.status === 'pending').length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Lots Available</h3>
                    <p className="text-muted-foreground">Create and verify lots first to generate parts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
};

export default VendorDashboard;
