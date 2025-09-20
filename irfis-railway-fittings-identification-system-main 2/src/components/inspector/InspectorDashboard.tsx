import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Scan, Search, Camera, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const InspectorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannedPart, setScannedPart] = useState(null);
  const [inspectionData, setInspectionData] = useState({
    condition: '',
    notes: '',
    photos: []
  });

  const mockPartData = {
    partName: 'Rail Joint Connector',
    factoryName: 'Steel Industries Ltd',
    lotNumber: 'RJC2024001',
    manufacturingDate: '2024-01-10',
    supplyDate: '2024-01-15',
    warrantyExpiryDate: '2029-01-15',
    lastInspectionDate: '2024-03-15',
    lastInspectedBy: 'Inspector Smith',
    installationLocation: 'Station ABC, Track 1, KM 45.2',
    installationDate: '2024-02-01'
  };

  const conditionOptions = [
    { value: 'good', label: 'Good', color: 'bg-success text-success-foreground' },
    { value: 'worn', label: 'Worn', color: 'bg-warning text-warning-foreground' },
    { value: 'replace', label: 'Replace Needed', color: 'bg-destructive text-destructive-foreground' }
  ];

  const handleScanQR = () => {
    // Mock QR scan
    setScannedPart(mockPartData);
    toast({
      title: "QR Code Scanned",
      description: "Part inspection data loaded successfully",
    });
  };

  const handleSubmitInspection = () => {
    if (!inspectionData.condition) {
      toast({
        title: "Missing Information",
        description: "Please select a condition assessment",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Inspection Submitted",
      description: `Part condition recorded as: ${inspectionData.condition}`,
    });

    // Reset form
    setInspectionData({
      condition: '',
      notes: '',
      photos: []
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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

      {/* Main Content */}
      <Tabs defaultValue="inspect" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inspect">Scan & Inspect</TabsTrigger>
          <TabsTrigger value="history">Inspection History</TabsTrigger>
          <TabsTrigger value="reports">Defect Reports</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Scan & Inspect Tab */}
        <TabsContent value="inspect" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="h-5 w-5 mr-2" />
                Scan & Inspection
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
                  <Search className="h-4 w-4 mr-2" />
                  Scan for Inspection
                </Button>
              </div>

              {/* Scanned Part Information */}
              {scannedPart && (
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4 text-primary">Part Inspection Details</h3>
                  
                  {/* Part Information Grid */}
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
                      <p className="text-sm font-medium text-muted-foreground">Lot Number</p>
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
                      <p className="text-sm font-medium text-muted-foreground">Warranty Expiry</p>
                      <p className="font-semibold">{new Date(mockPartData.warrantyExpiryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Installation Location</p>
                      <p className="font-semibold">{mockPartData.installationLocation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Installation Date</p>
                      <p className="font-semibold">{new Date(mockPartData.installationDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Last Inspection Info */}
                  {mockPartData.lastInspectionDate && (
                    <div className="bg-muted p-4 rounded-lg mb-6">
                      <h4 className="font-medium mb-2">Last Inspection</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          <span className="font-medium">{new Date(mockPartData.lastInspectionDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Inspector: </span>
                          <span className="font-medium">{mockPartData.lastInspectedBy}</span>
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
                        <Select value={inspectionData.condition} onValueChange={(value) => setInspectionData({...inspectionData, condition: value})}>
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
                        />
                        <p className="text-xs text-muted-foreground">Upload photos showing part condition and any defects</p>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-4">
                        <Button 
                          onClick={handleSubmitInspection}
                          className="bg-primary hover:bg-primary-dark"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Submit Inspection
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspection History Tab */}
        <TabsContent value="history">
          <Card className="shadow-card">
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
          <Card className="shadow-card">
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
          <Card className="shadow-card">
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