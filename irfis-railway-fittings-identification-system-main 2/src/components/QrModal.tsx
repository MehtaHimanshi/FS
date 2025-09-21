import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Printer, Copy, QrCode, Clock, CheckCircle } from 'lucide-react';

interface QrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrData: {
    type: string;
    id: string;
    partName: string;
    factoryName: string;
    lotNumber: string;
    manufacturingDate: string;
    supplyDate: string;
    warrantyPeriod: string;
    createdAt: string;
  } | null;
  qrImageData: string;
}

const QrModal: React.FC<QrModalProps> = ({ open, onOpenChange, qrData, qrImageData }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!qrData || !qrImageData) return null;

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = qrImageData;
      link.download = `qr-code-${qrData.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "QR code image is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${qrData.id}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px;
                  margin: 0;
                }
                .qr-container {
                  max-width: 400px;
                  margin: 0 auto;
                  border: 2px solid #003366;
                  padding: 20px;
                  border-radius: 8px;
                }
                .qr-image {
                  max-width: 100%;
                  height: auto;
                  margin: 20px 0;
                }
                .lot-info {
                  background: #f5f5f5;
                  padding: 15px;
                  border-radius: 4px;
                  margin: 20px 0;
                }
                .warning {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  padding: 10px;
                  border-radius: 4px;
                  margin: 20px 0;
                  font-size: 14px;
                }
                @media print {
                  body { margin: 0; }
                  .qr-container { border: none; }
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h1>Indian Railways IRFIS</h1>
                <h2>QR Code for Lot: ${qrData.id}</h2>
                
                <img src="${qrImageData}" alt="QR Code" class="qr-image" />
                
                <div class="lot-info">
                  <p><strong>Lot ID:</strong> ${qrData.id}</p>
                  <p><strong>Part Name:</strong> ${qrData.partName}</p>
                  <p><strong>Factory:</strong> ${qrData.factoryName}</p>
                  <p><strong>Lot Number:</strong> ${qrData.lotNumber}</p>
                  <p><strong>Manufacturing Date:</strong> ${new Date(qrData.manufacturingDate).toLocaleDateString()}</p>
                  <p><strong>Supply Date:</strong> ${new Date(qrData.supplyDate).toLocaleDateString()}</p>
                  <p><strong>Warranty Period:</strong> ${qrData.warrantyPeriod}</p>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong> This QR code contains lot information and can be scanned for tracking purposes.
                </div>
                
                <p><em>Generated on ${new Date().toLocaleString()}</em></p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Failed to open print dialog",
        variant: "destructive"
      });
    }
  };

  const handleCopyPayload = async () => {
    try {
      const payload = JSON.stringify(qrData, null, 2);
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied to Clipboard",
        description: "QR payload data has been copied",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy QR payload",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Generated
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Image */}
          <Card className="p-4">
            <CardContent className="flex flex-col items-center space-y-4">
              <img 
                src={qrImageData} 
                alt="QR Code" 
                className="w-48 h-48 border rounded-lg"
              />
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </Badge>
              </div>

              {/* Lot Info */}
              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p><strong>Lot ID:</strong> {qrData.id}</p>
                <p><strong>Part:</strong> {qrData.partName}</p>
                <p><strong>Factory:</strong> {qrData.factoryName}</p>
                <p><strong>Lot #:</strong> {qrData.lotNumber}</p>
                <p><strong>Warranty:</strong> {qrData.warrantyPeriod}</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Info:</strong> This QR code contains lot information and can be scanned for tracking purposes.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleDownload}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            
            <Button 
              onClick={handlePrint}
              className="w-full"
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print QR Code
            </Button>
            
            <Button 
              onClick={handleCopyPayload}
              className="w-full"
              variant="outline"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Payload'}
            </Button>
          </div>

          {/* Close Button */}
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrModal;
