import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, MapPin, Calendar, AlertTriangle, Package, Factory, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/QRScanner';
import apiService from '@/services/api';

interface LotData {
  _id: string;
  id: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  supplyDate: string;
  manufacturingDate: string;
  warrantyPeriod: string;
  status: 'pending' | 'verified' | 'rejected' | 'accepted' | 'held';
  vendorId: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

const TrackWorkerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannedPart, setScannedPart] = useState<LotData | null>(null);
  const [installationData, setInstallationData] = useState({
    location: '',
    section: '',
    installationDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleLotFound = (lot: LotData) => {
    setScannedPart(lot);
    toast({
      title: "Part Retrieved",
      description: `Found part: ${lot.partName}`,
    });
  };

  const handleInstallation = async () => {
    if (!scannedPart) return;
    
    if (!installationData.location || !installationData.section) {
      toast({
        title: "Missing Information",
        description: "Please provide location and section details",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.installLot(scannedPart.id, {
        location: installationData.location,
        section: installationData.section,
        installationDate: installationData.installationDate,
        notes: `Installed by ${user?.firstName} ${user?.lastName}`
      });

      if (response.success) {
        toast({
          title: "Installation Completed",
          description: `Part installed at ${installationData.location}, Section ${installationData.section}`,
        });

        // Reset form
        setScannedPart(null);
        setInstallationData({
          location: '',
          section: '',
          installationDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error: any) {
      console.error('Error installing part:', error);
      toast({
        title: "Installation Failed",
        description: error.message || "Failed to install part",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseReplacement = async () => {
    if (!scannedPart) return;

    setLoading(true);
    try {
      const response = await apiService.requestReplacement(scannedPart.id, {
        reason: "Part replacement required",
        description: `Replacement request for part ${scannedPart.partName} at ${installationData.location || 'Unknown location'}`,
        priority: 'medium'
      });

      if (response.success) {
        toast({
          title: "Replacement Request Raised",
          description: "Replacement request has been submitted for review",
        });

        // Reset form
        setScannedPart(null);
        setInstallationData({
          location: '',
          section: '',
          installationDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error: any) {
      console.error('Error raising replacement request:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to raise replacement request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Track Worker Dashboard</h1>
          <p className="text-muted-foreground">Scan and install railway fittings</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          {user?.firstName} {user?.lastName}
        </Badge>
      </div>

      {/* QR Scanner Section */}
      <QRScanner onLotFound={handleLotFound} />

      {/* Scanned Part Information */}
      {scannedPart && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Part Information
              </span>
              <Badge variant="outline">
                {scannedPart.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Part Name</Label>
                  <p className="text-sm text-muted-foreground">{scannedPart.partName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Factory/Supplier</Label>
                  <p className="text-sm text-muted-foreground">{scannedPart.factoryName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Lot/Box Number</Label>
                  <p className="text-sm text-muted-foreground font-mono">{scannedPart.lotNumber}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Manufacturing Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scannedPart.manufacturingDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Supply Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scannedPart.supplyDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Warranty Period</Label>
                  <p className="text-sm text-muted-foreground">{scannedPart.warrantyPeriod}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(new Date(scannedPart.supplyDate).getTime() + 5 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Installation Details */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Installation Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Station ABC"
                    value={installationData.location}
                    onChange={(e) => setInstallationData({...installationData, location: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section *</Label>
                  <Input
                    id="section"
                    placeholder="e.g., Track 1, KM 45.2"
                    value={installationData.section}
                    onChange={(e) => setInstallationData({...installationData, section: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installDate">Installation Date</Label>
                  <Input
                    id="installDate"
                    type="date"
                    value={installationData.installationDate}
                    onChange={(e) => setInstallationData({...installationData, installationDate: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleInstallation}
                  disabled={loading}
                  className="flex-1"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Install & Mark Complete
                </Button>
                <Button 
                  onClick={handleRaiseReplacement}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Raise Replacement Request
                </Button>
                <Button 
                  onClick={() => {
                    setScannedPart(null);
                    setInstallationData({
                      location: '',
                      section: '',
                      installationDate: new Date().toISOString().split('T')[0]
                    });
                  }}
                  variant="outline"
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Tabs for Future Features */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Installation History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Installation History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Installation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Recent installations and maintenance records will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Scheduled maintenance tasks and reminders will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackWorkerDashboard;