import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, FileText, AlertCircle, Package, Factory, Calendar, MapPin, User } from 'lucide-react';
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
  installationLocation?: string;
  installationDate?: string;
  lastInspectionDate?: string;
  lastInspectedBy?: string;
}

const InspectorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannedPart, setScannedPart] = useState<LotData | null>(null);
  const [inspectionData, setInspectionData] = useState({
    condition: '',
    notes: '',
    photos: [] as File[]
  });
  const [loading, setLoading] = useState(false);

  const conditionOptions = [
    { value: 'good', label: 'Good', color: 'bg-success text-success-foreground' },
    { value: 'worn', label: 'Worn', color: 'bg-warning text-warning-foreground' },
    { value: 'replace', label: 'Replace Needed', color: 'bg-destructive text-destructive-foreground' }
  ];

  const handleLotFound = (lot: LotData) => {
    setScannedPart(lot);
    toast({
      title: "Part Retrieved",
      description: `Found part: ${lot.partName}`,
    });
  };

  const handleSubmitInspection = async () => {
    if (!scannedPart) return;
    
    if (!inspectionData.condition) {
      toast({
        title: "Missing Information",
        description: "Please select a condition assessment",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload photos first if any
      let photoUrls: string[] = [];
      if (inspectionData.photos.length > 0) {
        const uploadResponse = await apiService.uploadInspectionPhotos(inspectionData.photos);
        if (uploadResponse.success) {
          photoUrls = uploadResponse.data.urls || [];
        }
      }

      // Submit inspection
      const response = await apiService.inspectLot(scannedPart.id, {
        condition: inspectionData.condition as 'good' | 'worn' | 'replace',
        notes: inspectionData.notes,
        photos: photoUrls,
        nextInspectionDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });

      if (response.success) {
        toast({
          title: "Inspection Submitted",
          description: `Part condition recorded as: ${inspectionData.condition}`,
        });

        // Reset form
        setScannedPart(null);
        setInspectionData({
          condition: '',
          notes: '',
          photos: []
        });
      }
    } catch (error: any) {
      console.error('Error submitting inspection:', error);
      toast({
        title: "Inspection Failed",
        description: error.message || "Failed to submit inspection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setInspectionData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
    toast({
      title: "Photos Added",
      description: `${files.length} photo(s) added to inspection`,
    });
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inspector Dashboard</h1>
          <p className="text-muted-foreground">Inspect and assess railway fittings condition</p>
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
                Part Inspection Details
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
                  <Label className="text-sm font-medium">Lot Number</Label>
                  <p className="text-sm text-muted-foreground font-mono">{scannedPart.lotNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Manufacturing Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scannedPart.manufacturingDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Supply Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scannedPart.supplyDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Warranty Expiry</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(new Date(scannedPart.supplyDate).getTime() + 5 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Installation Location</Label>
                  <p className="text-sm text-muted-foreground">
                    {scannedPart.installationLocation || 'Not installed'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Installation Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {scannedPart.installationDate ? new Date(scannedPart.installationDate).toLocaleDateString() : 'Not installed'}
                  </p>
                </div>
              </div>
            </div>

            {/* Last Inspection Info */}
            {scannedPart.lastInspectionDate && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Inspection
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-medium">{new Date(scannedPart.lastInspectionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="text-muted-foreground">Inspector: </span>
                    <span className="font-medium">{scannedPart.lastInspectedBy || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Inspection Form */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Current Inspection
              </h4>
              
              <div className="space-y-4">
                {/* Condition Assessment */}
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition Assessment *</Label>
                  <Select 
                    value={inspectionData.condition} 
                    onValueChange={(value) => setInspectionData({...inspectionData, condition: value})}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${option.color} text-xs`}>
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Inspection Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter detailed inspection notes, observations, and recommendations..."
                    value={inspectionData.notes}
                    onChange={(e) => setInspectionData({...inspectionData, notes: e.target.value})}
                    rows={3}
                    disabled={loading}
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="photos">Add Photos</Label>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Upload photos showing part condition and any defects</p>
                  {inspectionData.photos.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {inspectionData.photos.length} photo(s) selected
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleSubmitInspection}
                    disabled={loading}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Submit Inspection
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Tabs for Future Features */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Inspection History</TabsTrigger>
          <TabsTrigger value="reports">Defect Reports</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Inspection History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Inspection History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Recent inspections and assessments will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defect Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Defect Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Defect lot reports and quality issues will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Scheduled inspections and maintenance checks will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InspectorDashboard;