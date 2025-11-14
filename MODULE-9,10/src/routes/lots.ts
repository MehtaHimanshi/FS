// backend/routes/lotRoutes.ts
import express, { Request, Response } from 'express';
import { Lot } from '../models/Lot';
import { Part } from '../models/Part';
import { User } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/lots
 * - Vendors: returns lots for the logged-in vendor
 * - Admin (or others with access): returns all lots
 */
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    // role-based filter
    const role = req.user?.role;
    const query: any = {};

    if (role === 'vendor') {
      query.vendorId = req.user.id;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [lots, total] = await Promise.all([
      Lot.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Lot.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        lots,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err: any) {
    console.error('GET /api/lots error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching lots' });
  }
});

/**
 * POST /api/lots
 * - Vendor only: create a new lot
 */
router.post('/', authenticate, authorize('vendor'), async (req: any, res: Response) => {
  try {
    const { partName, factoryName, lotNumber, supplyDate, manufacturingDate, warrantyPeriod } = req.body;

    // basic validation
    if (!partName || !factoryName || !lotNumber || !supplyDate || !manufacturingDate || !warrantyPeriod) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // create
    const newLot = new Lot({
      id: Lot.generateLotId(),
      partName,
      factoryName,
      lotNumber,
      supplyDate,
      manufacturingDate,
      warrantyPeriod,
      vendorId: req.user.id,
      status: 'pending',
      qrCode: `QR-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    });

    await newLot.save();

    return res.status(201).json({
      success: true,
      data: newLot,
      message: 'Lot created successfully'
    });
  } catch (err: any) {
    console.error('POST /api/lots error:', err);
    // handle duplicate key (unique fields) gracefully
    if (err.code === 11000) {
      const dupField = Object.keys(err.keyValue || {}).join(', ');
      return res.status(400).json({ success: false, message: `Duplicate value for field(s): ${dupField}` });
    }
    return res.status(500).json({ success: false, message: 'Server error creating lot' });
  }
});

/**
 * GET /api/lots/:id
 * - Get lot by ID
 */
router.get('/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const lot = await Lot.findOne({ id: id.toUpperCase() });

    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    // Check if user has access to this lot
    const role = req.user?.role;
    if (role === 'vendor' && lot.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({
      success: true,
      data: lot
    });
  } catch (err: any) {
    console.error('GET /api/lots/:id error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching lot' });
  }
});

/**
 * GET /api/lots/qr/:id
 * - Get lot by ID for QR scanning (public endpoint, no auth required)
 */
router.get('/qr/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lot = await Lot.findOne({ id: id.toUpperCase() });

    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    return res.status(200).json({
      success: true,
      data: lot
    });
  } catch (err: any) {
    console.error('GET /api/lots/qr/:id error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching lot' });
  }
});

/**
 * PUT /api/lots/:id/status
 * - Update lot status with audit trail (Depot Staff Only)
 */
router.put('/:id/status', authenticate, authorize('depot-staff'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, sampleCheck } = req.body;
    const userId = req.user.id;

    if (!['pending', 'verified', 'rejected', 'accepted', 'held'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const lot = await Lot.findOne({ id: id.toUpperCase() });
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    // Add audit trail entry
    lot.auditTrail.push({
      timestamp: new Date(),
      actorId: userId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
      action: 'status_updated',
      details: `Status changed from ${lot.status} to ${status}`,
      metadata: {
        previousStatus: lot.status,
        newStatus: status,
        notes,
        sampleCheck
      }
    });

    // Update lot status
    lot.status = status;
    lot.updatedAt = new Date();
    await lot.save();

    // Add to user history
    const user = await User.findOne({ id: userId });
    if (user) {
      user.history.push({
        timestamp: new Date(),
        action: 'update_lot_status',
        targetType: 'lot',
        targetId: lot.id,
        details: `Updated lot ${lot.lotNumber} status to ${status}`,
        metadata: {
          previousStatus: lot.status,
          newStatus: status,
          notes,
          sampleCheck
        }
      });
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: lot,
      message: 'Lot status updated successfully'
    });
  } catch (err: any) {
    console.error('PUT /api/lots/:id/status error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating lot status' });
  }
});

/**
 * POST /api/lots/:id/generate-parts
 * - Generate parts from lot (Admin/Vendor Only)
 */
router.post('/:id/generate-parts', authenticate, authorize('admin', 'vendor'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0 || quantity > 1000) {
      return res.status(400).json({ success: false, message: 'Invalid quantity (1-1000)' });
    }

    const lot = await Lot.findOne({ id: id.toUpperCase() });
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    // Check if vendor owns this lot (for vendor role)
    if (req.user.role === 'vendor' && lot.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Generate parts
    const parts = [];
    for (let i = 0; i < quantity; i++) {
      const part = new Part({
        id: Part.generatePartId(),
        lotId: lot.id,
        partName: lot.partName,
        factoryName: lot.factoryName,
        lotNumber: lot.lotNumber,
        manufacturingDate: lot.manufacturingDate,
        supplyDate: lot.supplyDate,
        warrantyPeriod: lot.warrantyPeriod,
        isInstalled: false
      });
      await part.save();
      parts.push(part);
    }

    return res.status(201).json({
      success: true,
      data: { parts, count: parts.length },
      message: `${quantity} parts generated successfully`
    });
  } catch (err: any) {
    console.error('POST /api/lots/:id/generate-parts error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating parts' });
  }
});

/**
 * GET /api/lots/:id/parts
 * - Get parts in lot
 */
router.get('/:id/parts', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const isInstalled = req.query.installed === 'true';

    // Verify lot exists and user has access
    const lot = await Lot.findOne({ id: id.toUpperCase() });
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    const role = req.user?.role;
    if (role === 'vendor' && lot.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Build query
    const query: any = { lotId: lot.id };
    if (req.query.installed !== undefined) {
      query.isInstalled = isInstalled;
    }

    const [parts, total] = await Promise.all([
      Part.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Part.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        parts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err: any) {
    console.error('GET /api/lots/:id/parts error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching parts' });
  }
});

export default router;
