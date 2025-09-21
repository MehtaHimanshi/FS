import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, CameraOff, QrCode, AlertCircle, CheckCircle } from 'lucide-react';

interface CameraScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (data: any) => void;
  title?: string;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ 
  open, 
  onOpenChange, 
  onScanSuccess,
  title = "Scan QR Code"
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoDevice);
      } catch (error) {
        console.error('Error checking camera:', error);
        setHasCamera(false);
      }
    };

    if (open) {
      checkCamera();
    }
  }, [open]);

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        toast({
          title: "Camera Started",
          description: "Point your camera at a QR code to scan",
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access or use manual input",
        variant: "destructive"
      });
      setHasCamera(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Mock QR scanning (in a real app, you'd use a library like jsQR or zxing)
  const scanQRCode = () => {
    // This is a mock implementation
    // In production, you'd use a QR code scanning library
    const mockQRData = {
      type: 'lot',
      lotId: 'LOT1234567890',
      partName: 'Rail Joint Connector',
      factoryName: 'Steel Industries Ltd',
      lotNumber: 'RJC2024001',
      manufacturingDate: '2024-01-10',
      supplyDate: '2024-01-15',
      warrantyPeriod: '5 years',
      createdAt: new Date().toISOString()
    };

    setScanResult(JSON.stringify(mockQRData));
    
    toast({
      title: "QR Code Scanned",
      description: "QR code detected successfully",
    });

    // Simulate processing delay
    setTimeout(() => {
      onScanSuccess(mockQRData);
      onOpenChange(false);
    }, 1000);
  };

  // Handle manual input
  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a lot ID or QR payload",
        variant: "destructive"
      });
      return;
    }

    try {
      // Try to parse as JSON first (QR payload)
      let qrData;
      try {
        qrData = JSON.parse(manualInput);
      } catch {
        // If not JSON, treat as lot ID
        qrData = {
          type: 'lot',
          lotId: manualInput.trim().toUpperCase(),
          partName: 'Unknown Part',
          factoryName: 'Unknown Factory',
          lotNumber: manualInput.trim(),
          manufacturingDate: new Date().toISOString(),
          supplyDate: new Date().toISOString(),
          warrantyPeriod: 'Unknown',
          createdAt: new Date().toISOString()
        };
      }

      onScanSuccess(qrData);
      onOpenChange(false);
      
      toast({
        title: "Manual Input Processed",
        description: "Lot data processed successfully",
      });
    } catch (error) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid lot ID or QR payload",
        variant: "destructive"
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Section */}
          {hasCamera && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Video Element */}
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-48 object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* Scanning Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-white border-dashed w-32 h-32 rounded-lg flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-white opacity-50" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex gap-2">
                    {!isScanning ? (
                      <Button onClick={startCamera} className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button onClick={scanQRCode} className="flex-1" variant="default">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Scan QR Code
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          <CameraOff className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Scan Result */}
                  {scanResult && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Scanned:</strong> {scanResult.substring(0, 50)}...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Input Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Camera not available? Enter manually:</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manualInput">Lot ID or QR Payload</Label>
                  <Input
                    id="manualInput"
                    placeholder="Enter lot ID (e.g., LOT1234567890) or QR payload JSON"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleManualSubmit}
                  className="w-full"
                  variant="outline"
                >
                  Process Manual Input
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Use camera to scan QR codes automatically</li>
                <li>• Or manually enter lot ID or QR payload data</li>
                <li>• QR codes contain lot information and optional tokens</li>
              </ul>
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full"
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScanner;
