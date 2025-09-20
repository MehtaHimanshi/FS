import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Scan, Wrench, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const TrackWorkerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannedPart, setScannedPart] = useState(null);
  const [installationData, setInstallationData] = useState({
    location: '',
    section: '',
    installationDate: new Date().toISOString().split('T')[0]
  });

  const mockPartData = {
    partName: 'Rail Joint Connector',
    factoryName: 'Steel Industries Ltd',
    lotNumber: 'RJC2024001',
    manufacturingDate: '2024-01-10',
    supplyDate: '2024-01-15',
    warrantyPeriod: '5 years',
    warrantyExpiryDate: '2029-01-15'
  };

  const handleScanQR = () => {
    // Mock QR scan
    setScannedPart(mockPartData);
    toast({
      title: "QR Code Scanned",
      description: "Part information loaded successfully",
    });
  };

  const handleInstallation = () => {
    if (!installationData.location || !installationData.section) {
      toast({
        title: "Missing Information",
        description: "Please provide location and section details",
        variant: "destructive"
      });
      return;
    }

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
  };

  const handleRaiseReplacement = () => {
    toast({
      title: "Replacement Request Raised",
      description: "Replacement request has been submitted for review",
    });
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

      {/* Main Content */}
      <Tabs defaultValue="install" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="install">Scan & Install</TabsTrigger>
          <TabsTrigger value="history">Installation History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Scan & Install Tab */}
        <TabsContent value="install" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="h-5 w-5 mr-2" />
                Scan & Install Part
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Scanner */}
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-32 h-32 border-2 border-dashed border-railway-qr rounded-lg mb-4">
                  <QrCode className="h-12 w-12 text-railway-qr" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Position QR code within the frame</p>
                <Button onClick={handleScanQR} className="bg-primary hover:bg-primary-dark">
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Part QR
                </Button>
              </div>

              {/* Scanned Part Information */}
              {scannedPart && (
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4 text-primary">Part Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Part Name</p>
                      <p className="font-semibold">{mockPartData.partName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Factory/Supplier</p>
                      <p className="font-semibold">{mockPartData.factoryName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lot/Box Number</p>
                      <p className="font-semibold font-mono">{mockPartData.lotNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Manufacturing Date</p>
                      <p className="font-semibold">{new Date(mockPartData.manufacturingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Supply Date</p>
                      <p className="font-semibold">{new Date(mockPartData.supplyDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Warranty Period</p>
                      <p className="font-semibold">{mockPartData.warrantyPeriod}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(mockPartData.warrantyExpiryDate).toLocaleDateString()}
                      </p>
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Section *</Label>
                        <Input
                          id="section"
                          placeholder="e.g., Track 1, KM 45.2"
                          value={installationData.section}
                          onChange={(e) => setInstallationData({...installationData, section: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="installDate">Installation Date</Label>
                        <Input
                          id="installDate"
                          type="date"
                          value={installationData.installationDate}
                          onChange={(e) => setInstallationData({...installationData, installationDate: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button 
                        onClick={handleInstallation}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Install & Mark Complete
                      </Button>
                      <Button 
                        onClick={handleRaiseReplacement}
                        variant="destructive"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Raise Replacement Request
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installation History Tab */}
        <TabsContent value="history">
          <Card className="shadow-card">
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
          <Card className="shadow-card">
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