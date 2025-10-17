import express from 'express';
import QRCode from 'qrcode';
import { Lot } from '../models/Lot';
import { Part } from '../models/Part';
import { authenticate } from '../middleware/auth';
import { QRCodeData, ApiResponse } from '../types';

const router = express.Router();

// @route   POST /api/qr/generate
// @desc    Generate QR code for lot or part
// @access  Private
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({
        success: false,
        message: 'Type and ID are required'
      });
    }

    let data: any;
    let qrData: QRCodeData;

    if (type === 'lot') {
      data = await Lot.findOne({ id: id.toUpperCase() });
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Lot not found'
        });
      }

      qrData = {
        type: 'lot',
        id: data.id,
        partName: data.partName,
        factoryName: data.factoryName,
        lotNumber: data.lotNumber,
        manufacturingDate: data.manufacturingDate.toISOString(),
        supplyDate: data.supplyDate.toISOString(),
        warrantyPeriod: data.warrantyPeriod,
        createdAt: data.createdAt.toISOString()
      };
    } else if (type === 'part') {
      data = await Part.findOne({ id: id.toUpperCase() });
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }

      qrData = {
        type: 'part',
        id: data.id,
        partName: data.partName,
        factoryName: data.factoryName,
        lotNumber: data.lotNumber,
        manufacturingDate: data.manufacturingDate.toISOString(),
        supplyDate: data.supplyDate.toISOString(),
        warrantyPeriod: data.warrantyPeriod,
        createdAt: data.createdAt.toISOString()
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "lot" or "part"'
      });
    }

    // Generate QR code
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#003366', // Indian Railways Blue
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Update the QR code in database
    if (type === 'lot') {
      await Lot.findOneAndUpdate({ id: data.id }, { qrCode: qrCodeDataURL });
    } else {
      await Part.findOneAndUpdate({ id: data.id }, { qrCode: qrCodeDataURL });
    }

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        qrData,
        type,
        id: data.id
      },
      message: 'QR code generated successfully'
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating QR code'
    });
  }
});

// @route   POST /api/qr/scan
// @desc    Scan QR code and return data
// @access  Private
router.post('/scan', authenticate, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    let parsedData: QRCodeData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Validate required fields
    const requiredFields = ['type', 'id', 'partName', 'factoryName', 'lotNumber'];
    for (const field of requiredFields) {
      if (!parsedData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }

    let databaseRecord: any;

    if (parsedData.type === 'lot') {
      databaseRecord = await Lot.findOne({ id: parsedData.id });
    } else if (parsedData.type === 'part') {
      databaseRecord = await Part.findOne({ id: parsedData.id })
        .populate('lotId', 'status vendorId');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code type'
      });
    }

    if (!databaseRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found in database'
      });
    }

    // Add additional data based on type
    let responseData: any = {
      ...parsedData,
      databaseRecord
    };

    if (parsedData.type === 'part') {
      // Add installation data if available
      if (databaseRecord.installationData) {
        responseData.installationData = databaseRecord.installationData;
      }
      
      // Add lot status if available
      if (databaseRecord.lotId && typeof databaseRecord.lotId === 'object') {
        responseData.lotStatus = databaseRecord.lotId.status;
        responseData.vendorId = databaseRecord.lotId.vendorId;
      }
    }

    res.json({
      success: true,
      data: responseData,
      message: 'QR code scanned successfully'
    });

  } catch (error) {
    console.error('Scan QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error scanning QR code'
    });
  }
});

// @route   GET /api/qr/:type/:id
// @desc    Get QR code for existing lot or part
// @access  Private
router.get('/:type/:id', authenticate, async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!['lot', 'part'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "lot" or "part"'
      });
    }

    let data: any;

    if (type === 'lot') {
      data = await Lot.findOne({ id: id.toUpperCase() });
    } else {
      data = await Part.findOne({ id: id.toUpperCase() });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`
      });
    }

    if (!data.qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not generated for this record'
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: data.qrCode,
        type,
        id: data.id
      },
      message: 'QR code retrieved successfully'
    });

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving QR code'
    });
  }
});

export default router;
