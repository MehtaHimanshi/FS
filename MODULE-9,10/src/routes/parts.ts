import express from 'express';
import Joi from 'joi';
import { Part } from '../models/Part';
import { Lot } from '../models/Lot';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// Validation schemas
const installationSchema = Joi.object({
  location: Joi.string().required().trim().min(2).max(100),
  section: Joi.string().required().trim().min(2).max(100),
  installationDate: Joi.date().optional()
});

// @route   GET /api/parts
// @desc    Get all parts with filtering
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isInstalled, 
      lotNumber, 
      partName,
      factoryName 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};

    // Role-based filtering
    if (req.user.role === 'vendor') {
      // Get lots created by vendor first
      const vendorLots = await Lot.find({ vendorId: req.user.id }).select('id');
      const lotIds = vendorLots.map(lot => lot.id);
      query.lotId = { $in: lotIds };
    }

    // Apply filters
    if (isInstalled !== undefined) {
      query.isInstalled = isInstalled === 'true';
    }

    if (lotNumber) {
      query.lotNumber = { $regex: lotNumber, $options: 'i' };
    }

    if (partName) {
      query.partName = { $regex: partName, $options: 'i' };
    }

    if (factoryName) {
      query.factoryName = { $regex: factoryName, $options: 'i' };
    }

    const parts = await Part.find(query)
      .populate('lotId', 'status vendorId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Part.countDocuments(query);

    res.json({
      success: true,
      data: {
        parts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Parts retrieved successfully'
    });

  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving parts'
    });
  }
});

// @route   GET /api/parts/:id
// @desc    Get part by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const part = await Part.findOne({ id: req.params.id.toUpperCase() })
      .populate('lotId', 'status vendorId');

    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }

    // Check access permissions for vendors
    if (req.user.role === 'vendor') {
      const lot = await Lot.findOne({ id: part.lotId });
      if (!lot || lot.vendorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: part,
      message: 'Part retrieved successfully'
    });

  } catch (error) {
    console.error('Get part error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving part'
    });
  }
});

// @route   POST /api/parts/:id/install
// @desc    Install part (Track Worker only)
// @access  Private (Track Worker)
router.post('/:id/install', authenticate, authorize('track-worker'), async (req, res) => {
  try {
    const { error, value } = installationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const part = await Part.findOne({ id: req.params.id.toUpperCase() });

    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }

    if (part.isInstalled) {
      return res.status(400).json({
        success: false,
        message: 'Part is already installed'
      });
    }

    // Update part with installation data
    part.isInstalled = true;
    part.installationData = {
      location: value.location,
      section: value.section,
      installationDate: value.installationDate || new Date(),
      installedBy: req.user.id
    };

    await part.save();

    res.json({
      success: true,
      data: part,
      message: 'Part installed successfully'
    });

  } catch (error) {
    console.error('Install part error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error installing part'
    });
  }
});

// @route   GET /api/parts/installed
// @desc    Get installed parts
// @access  Private
router.get('/installed', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      location, 
      section,
      installedBy 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = { isInstalled: true };

    // Apply filters
    if (location) {
      query['installationData.location'] = { $regex: location, $options: 'i' };
    }

    if (section) {
      query['installationData.section'] = { $regex: section, $options: 'i' };
    }

    if (installedBy) {
      query['installationData.installedBy'] = installedBy;
    }

    const parts = await Part.find(query)
      .populate('lotId', 'status vendorId')
      .sort({ 'installationData.installationDate': -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Part.countDocuments(query);

    res.json({
      success: true,
      data: {
        parts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Installed parts retrieved successfully'
    });

  } catch (error) {
    console.error('Get installed parts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving installed parts'
    });
  }
});

// @route   GET /api/parts/installation-history/:workerId
// @desc    Get installation history for a track worker
// @access  Private
router.get('/installation-history/:workerId', authenticate, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Check if user is admin or the worker themselves
    if (req.user.role !== 'admin' && req.user.id !== workerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const parts = await Part.find({ 
      'installationData.installedBy': workerId,
      isInstalled: true 
    })
      .populate('lotId', 'status vendorId')
      .sort({ 'installationData.installationDate': -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Part.countDocuments({ 
      'installationData.installedBy': workerId,
      isInstalled: true 
    });

    res.json({
      success: true,
      data: {
        workerId,
        parts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Installation history retrieved successfully'
    });

  } catch (error) {
    console.error('Get installation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving installation history'
    });
  }
});

export default router;
