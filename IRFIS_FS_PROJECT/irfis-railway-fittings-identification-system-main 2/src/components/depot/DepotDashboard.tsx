import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, CheckCircle, XCircle, Clock, Package, Factory, Calendar, Shield } from 'lucide-react';
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
  auditTrail: any[];
}

const DepotDashboard: React.FC = () => {
  const { toast } = useToast();
  const [scannedLot, setScannedLot] = useState<LotData | null>(null);
  const [sampleCheck, setSampleCheck] = useState({
    visual: false,
    dimensions: false,
    material: false,
    finish: false
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLotFound = (lot: LotData) => {
    setScannedLot(lot);
    toast({
      title: "Lot Retrieved",
      description: `Found lot: ${lot.lotNumber}`,
    });
  };

  const handleAcceptLot = async () => {
    if (!scannedLot) return;

    setLoading(true);
    try {
      const response = await apiService.updateLotStatus(
        scannedLot.id, 
        'accepted', 
        notes,
        sampleCheck
      );

      if (response.success) {
        toast({
          title: "Lot Accepted",
          description: `Lot ${scannedLot.lotNumber} has been accepted`,
        });
        
        // Reset form
        setScannedLot(null);
        setSampleCheck({ visual: false, dimensions: false, material: false, finish: false });
        setNotes('');
      }
    } catch (error: any) {
      console.error('Error accepting lot:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept lot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHoldLot = async () => {
    if (!scannedLot) return;

    setLoading(true);
    try {
      const response = await apiService.updateLotStatus(
        scannedLot.id, 
        'held', 
        notes,
        sampleCheck
      );

      if (response.success) {
        toast({
          title: "Lot Held",
          description: `Lot ${scannedLot.lotNumber} has been held for review`,
        });
        
        // Reset form
        setScannedLot(null);
        setSampleCheck({ visual: false, dimensions: false, material: false, finish: false });
        setNotes('');
      }
    } catch (error: any) {
      console.error('Error holding lot:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to hold lot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'held':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Held</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Depot Staff Dashboard</h1>
          <p className="text-muted-foreground">Scan and verify lots for acceptance</p>
        </div>
      </div>

      {/* QR Scanner Section */}
      <QRScanner onLotFound={handleLotFound} />

      {/* Scanned Lot Details */}
      {scannedLot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lot Details
              </span>
              {getStatusBadge(scannedLot.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Lot ID</Label>
                  <p className="text-sm text-muted-foreground">{scannedLot.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Lot Number</Label>
                  <p className="text-sm text-muted-foreground">{scannedLot.lotNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Part Name</Label>
                  <p className="text-sm text-muted-foreground">{scannedLot.partName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Factory</Label>
                  <p className="text-sm text-muted-foreground">{scannedLot.factoryName}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Manufacturing Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scannedLot.manufacturingDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Supply Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scannedLot.supplyDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Warranty Period</Label>
                  <p className="text-sm text-muted-foreground">{scannedLot.warrantyPeriod}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vendor ID</Label>
                  <p className="text-sm text-muted-foreground">{scannedLot.vendorId}</p>
                </div>
              </div>
            </div>

            {/* Sample Check */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sample Check</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="visual"
                    checked={sampleCheck.visual}
                    onChange={(e) => setSampleCheck(prev => ({ ...prev, visual: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="visual" className="text-sm">Visual Inspection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dimensions"
                    checked={sampleCheck.dimensions}
                    onChange={(e) => setSampleCheck(prev => ({ ...prev, dimensions: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="dimensions" className="text-sm">Dimensions Check</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="material"
                    checked={sampleCheck.material}
                    onChange={(e) => setSampleCheck(prev => ({ ...prev, material: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="material" className="text-sm">Material Quality</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="finish"
                    checked={sampleCheck.finish}
                    onChange={(e) => setSampleCheck(prev => ({ ...prev, finish: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="finish" className="text-sm">Surface Finish</Label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about the inspection..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleAcceptLot}
                disabled={loading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Lot
              </Button>
              <Button 
                onClick={handleHoldLot}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Hold Lot
              </Button>
              <Button 
                onClick={() => {
                  setScannedLot(null);
                  setSampleCheck({ visual: false, dimensions: false, material: false, finish: false });
                  setNotes('');
                }}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepotDashboard;