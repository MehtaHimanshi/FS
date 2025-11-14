import express from 'express';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { Lot } from '../models/Lot';
import { User } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// @route   POST /api/lots/:lotId/generate-qr
// @desc    Generate ephemeral QR code for lot (Vendor only)
// @access  Private (Vendor)
router.post('/:lotId/generate-qr', authenticate, authorize('vendor'), async (req: any, res: Response<ApiResponse>) => {
  try {
    const { lotId } = req.params;
    const userId = req.user.id;

    // Find the lot
    const lot = await Lot.findOne({ id: lotId.toUpperCase() });
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lot not found'
      });
    }

    // Check if vendor owns this lot
    if (lot.vendorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only generate QR codes for your own lots.'
      });
    }

    // Generate QR data payload
    const qrData = {
      type: 'lot',
      lotId: lot.id,
      partName: lot.partName,
      factoryName: lot.factoryName,
      lotNumber: lot.lotNumber,
      manufacturingDate: lot.manufacturingDate.toISOString(),
      supplyDate: lot.supplyDate.toISOString(),
      warrantyPeriod: lot.warrantyPeriod,
      createdAt: lot.createdAt.toISOString()
    };

    // Generate ephemeral QR token (optional, for additional security)
    const qrToken = uuidv4().substring(0, 8);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate QR image in memory (ephemeral - not stored in DB)
    const qrString = JSON.stringify(qrData);
    const qrImageDataUrl = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#003366', // Indian Railways Blue
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Store QR token with TTL (for optional token-based access)
    lot.qrTokens.push({
      token: qrToken,
      generatedAt: new Date(),
      expiresAt,
      generatedBy: userId
    });

    // Add audit trail entry
    lot.auditTrail.push({
      timestamp: new Date(),
      actorId: userId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
      action: 'qr_generated',
      details: 'Ephemeral QR code generated for lot',
      metadata: {
        qrToken,
        expiresAt: expiresAt.toISOString()
      }
    });

    await lot.save();

    // Add to user history
    const user = await User.findOne({ id: userId });
    if (user) {
      user.history.push({
        timestamp: new Date(),
        action: 'generate_qr',
        targetType: 'lot',
        targetId: lot.id,
        details: `Generated QR code for lot ${lot.lotNumber}`,
        metadata: {
          qrToken,
          expiresAt: expiresAt.toISOString()
        }
      });
      await user.save();
    }

    res.json({
      success: true,
      data: {
        lotId: lot.id,
        qrData: qrString,
        qrImageDataUrl, // Ephemeral - not stored in DB
        qrToken,
        expiresAt: expiresAt.toISOString()
      },
      message: 'Ephemeral QR code generated successfully'
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating QR code'
    });
  }
});

// @route   GET /api/lots/:lotId?token=<token>
// @desc    Get lot by ID with optional token validation
// @access  Private
router.get('/:lotId', authenticate, async (req: any, res: Response<ApiResponse>) => {
  try {
    const { lotId } = req.params;
    const { token } = req.query;
    const userId = req.user.id;

    // Find the lot
    const lot = await Lot.findOne({ id: lotId.toUpperCase() });
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lot not found'
      });
    }

    // If token is provided, validate it
    if (token) {
      const qrToken = lot.qrTokens.find(t => t.token === token);
      if (!qrToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid QR token'
        });
      }

      if (new Date() > qrToken.expiresAt) {
        return res.status(401).json({
          success: false,
          message: 'QR token has expired'
        });
      }
    } else {
      // Regular access control
      const role = req.user?.role;
      if (role === 'vendor' && lot.vendorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: lot,
      message: 'Lot retrieved successfully'
    });

  } catch (error) {
    console.error('Get lot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving lot'
    });
  }
});

export default router;
