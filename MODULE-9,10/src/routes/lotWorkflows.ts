import express, { Response } from 'express';
import { Lot } from '../models/Lot';
import { Part } from '../models/Part';
import { User } from '../models/User';
import { ReplacementRequest } from '../models/ReplacementRequest';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// @route   POST /api/lots/:lotId/install
// @desc    Mark lot/part as installed (Track Worker only)
// @access  Private (Track Worker)
router.post('/:lotId/install', authenticate, authorize('track-worker'), async (req: any, res: Response) => {
  try {
    const { lotId } = req.params;
    const { location, section, installationDate, notes } = req.body;
    const userId = req.user.id;

    if (!location || !section) {
      return res.status(400).json({
        success: false,
        message: 'Location and section are required'
      });
    }

    const lot = await Lot.findOne({ id: lotId.toUpperCase() });
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lot not found'
      });
    }

    // Add audit trail entry
    lot.auditTrail.push({
      timestamp: new Date(),
      actorId: userId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
      action: 'installation_recorded',
      details: `Installation recorded at ${location}, ${section}`,
      metadata: {
        location,
        section,
        installationDate: installationDate || new Date().toISOString(),
        notes
      }
    });

    await lot.save();

    // Add to user history
    const user = await User.findOne({ id: userId });
    if (user) {
      user.history.push({
        timestamp: new Date(),
        action: 'install_lot',
        targetType: 'lot',
        targetId: lot.id,
        details: `Installed lot ${lot.lotNumber} at ${location}`,
        metadata: {
          location,
          section,
          installationDate: installationDate || new Date().toISOString(),
          notes
        }
      });
      await user.save();
    }

    res.json({
      success: true,
      data: lot,
      message: 'Installation recorded successfully'
    });

  } catch (error) {
    console.error('Install lot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording installation'
    });
  }
});

// @route   POST /api/lots/:lotId/inspection
// @desc    Record inspection for lot (Inspector only)
// @access  Private (Inspector)
router.post('/:lotId/inspection', authenticate, authorize('inspector'), async (req: any, res: Response) => {
  try {
    const { lotId } = req.params;
    const { condition, notes, photos, nextInspectionDue } = req.body;
    const userId = req.user.id;

    if (!condition || !['good', 'worn', 'replace'].includes(condition)) {
      return res.status(400).json({
        success: false,
        message: 'Valid condition is required (good, worn, replace)'
      });
    }

    const lot = await Lot.findOne({ id: lotId.toUpperCase() });
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lot not found'
      });
    }

    // Add audit trail entry
    lot.auditTrail.push({
      timestamp: new Date(),
      actorId: userId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
      action: 'inspection_recorded',
      details: `Inspection completed - condition: ${condition}`,
      metadata: {
        condition,
        notes,
        photos: photos || [],
        nextInspectionDue,
        inspectionDate: new Date().toISOString()
      }
    });

    await lot.save();

    // Add to user history
    const user = await User.findOne({ id: userId });
    if (user) {
      user.history.push({
        timestamp: new Date(),
        action: 'inspect_lot',
        targetType: 'lot',
        targetId: lot.id,
        details: `Inspected lot ${lot.lotNumber} - condition: ${condition}`,
        metadata: {
          condition,
          notes,
          photos: photos || [],
          nextInspectionDue,
          inspectionDate: new Date().toISOString()
        }
      });
      await user.save();
    }

    res.json({
      success: true,
      data: lot,
      message: 'Inspection recorded successfully'
    });

  } catch (error) {
    console.error('Inspect lot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording inspection'
    });
  }
});

// @route   POST /api/lots/:lotId/replacement-request
// @desc    Create replacement request for lot (Track Worker/Inspector only)
// @access  Private (Track Worker, Inspector)
router.post('/:lotId/replacement-request', authenticate, authorize('track-worker', 'inspector'), async (req: any, res: Response) => {
  try {
    const { lotId } = req.params;
    const { reason, description, photos, priority = 'medium' } = req.body;
    const userId = req.user.id;

    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Reason and description are required'
      });
    }

    const lot = await Lot.findOne({ id: lotId.toUpperCase() });
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lot not found'
      });
    }

    // Create replacement request
    const replacementRequest = new ReplacementRequest({
      id: ReplacementRequest.generateReplacementRequestId(),
      lotId: lot.id,
      requestedBy: userId,
      requestedByRole: req.user.role,
      reason,
      description,
      photos: photos || [],
      priority,
      status: 'pending'
    });

    await replacementRequest.save();

    // Add audit trail entry to lot
    lot.auditTrail.push({
      timestamp: new Date(),
      actorId: userId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
      action: 'replacement_requested',
      details: `Replacement request created - reason: ${reason}`,
      metadata: {
        requestId: replacementRequest.id,
        reason,
        description,
        priority,
        photos: photos || []
      }
    });

    await lot.save();

    // Add to user history
    const user = await User.findOne({ id: userId });
    if (user) {
      user.history.push({
        timestamp: new Date(),
        action: 'request_replacement',
        targetType: 'lot',
        targetId: lot.id,
        details: `Requested replacement for lot ${lot.lotNumber}`,
        metadata: {
          requestId: replacementRequest.id,
          reason,
          description,
          priority,
          photos: photos || []
        }
      });
      await user.save();
    }

    res.status(201).json({
      success: true,
      data: replacementRequest,
      message: 'Replacement request created successfully'
    });

  } catch (error) {
    console.error('Create replacement request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating replacement request'
    });
  }
});

export default router;
