import QRCode from 'qrcode';

export interface QRCodeData {
  type: 'lot' | 'part';
  id: string;
  partName: string;
  factoryName: string;
  lotNumber: string;
  manufacturingDate: string;
  supplyDate: string;
  warrantyPeriod: string;
  createdAt: string;
}

export const generateQRCodeData = (data: Omit<QRCodeData, 'createdAt'>): QRCodeData => {
  return {
    ...data,
    createdAt: new Date().toISOString()
  };
};

export const generateQRCode = async (data: QRCodeData): Promise<string> => {
  try {
    const qrString = JSON.stringify(data);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#003366', // Indian Railways Blue
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const parseQRCode = (qrString: string): QRCodeData | null => {
  try {
    const data = JSON.parse(qrString);
    
    // Validate required fields
    const requiredFields = ['type', 'id', 'partName', 'factoryName', 'lotNumber'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return data as QRCodeData;
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

// Mock QR scanner for demo purposes
export const mockQRScan = (): Promise<QRCodeData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData: QRCodeData = {
        type: 'part',
        id: `PART${Date.now()}`,
        partName: 'Rail Joint Connector',
        factoryName: 'Steel Industries Ltd',
        lotNumber: 'RJC2024001',
        manufacturingDate: '2024-01-10',
        supplyDate: '2024-01-15',
        warrantyPeriod: '5 years',
        createdAt: new Date().toISOString()
      };
      resolve(mockData);
    }, 1500); // Simulate scan delay
  });
};