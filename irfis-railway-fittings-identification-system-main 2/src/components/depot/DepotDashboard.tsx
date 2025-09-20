import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Scan, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DepotDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannedLot, setScannedLot] = useState(null);
  const [checkDecision, setCheckDecision] = useState<'accept' | 'hold' | null>(null);

  const mockLotData = {
    partName: 'Rail Joint Connector',
    factoryName: 'Steel Industries Ltd',
    lotNumber: 'RJC2024001',
    supplyDate: '2024-01-15',
    manufacturingDate: '2024-01-10',
    warrantyPeriod: '5 years'
  };

  const handleScanQR = () => {
    // Mock QR scan
    setScannedLot(mockLotData);
    toast({
      title: "QR Code Scanned",
      description: "Lot information loaded successfully",
    });
  };

  const handleSampleCheck = (decision: 'accept' | 'hold') => {
    setCheckDecision(decision);
    toast({
      title: decision === 'accept' ? "Lot Accepted" : "Lot Held",
      description: `Lot ${mockLotData.lotNumber} has been ${decision === 'accept' ? 'accepted' : 'held for review'}`,
      variant: decision === 'accept' ? 'default' : 'destructive'
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
          <h1 className="text-3xl font-bold text-primary">Depot Staff Dashboard</h1>
          <p className="text-muted-foreground">Scan and verify incoming lots</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          {user?.firstName} {user?.lastName}
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scan">Scan & Check</TabsTrigger>
          <TabsTrigger value="history">Check History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Scan & Check Tab */}
        <TabsContent value="scan" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="h-5 w-5 mr-2" />
                Scan Lot QR / Box QR
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
                  Scan QR Code
                </Button>
              </div>

              {/* Scanned Lot Information */}
              {scannedLot && (
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4 text-primary">Lot Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Part Name</p>
                      <p className="font-semibold">{mockLotData.partName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Factory/Supplier</p>
                      <p className="font-semibold">{mockLotData.factoryName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lot Number</p>
                      <p className="font-semibold font-mono">{mockLotData.lotNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Supply Date</p>
                      <p className="font-semibold">{new Date(mockLotData.supplyDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Manufacturing Date</p>
                      <p className="font-semibold">{new Date(mockLotData.manufacturingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Warranty Period</p>
                      <p className="font-semibold">{mockLotData.warrantyPeriod}</p>
                    </div>
                  </div>

                  {/* Sample Check Actions */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4">Sample Check Decision</h4>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleSampleCheck('accept')}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                        disabled={checkDecision !== null}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        onClick={() => handleSampleCheck('hold')}
                        variant="destructive"
                        disabled={checkDecision !== null}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Hold
                      </Button>
                    </div>

                    {checkDecision === 'hold' && (
                      <div className="mt-4 p-4 bg-destructive-light rounded-lg">
                        <p className="text-sm text-destructive mb-2">Lot has been held for review</p>
                        <Button 
                          onClick={handleRaiseReplacement}
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Raise Replacement Request
                        </Button>
                      </div>
                    )}

                    {checkDecision === 'accept' && (
                      <div className="mt-4 p-4 bg-success-light rounded-lg">
                        <p className="text-sm text-success">Lot has been accepted and is ready for installation</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check History Tab */}
        <TabsContent value="history">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Check History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Recent lot checks and decisions will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Depot Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Depot statistics and reports will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DepotDashboard;