import express from 'express';
import Joi from 'joi';
import { Inspection } from '../models/Inspection';
import { Part } from '../models/Part';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// Validation schemas
const createInspectionSchema = Joi.object({
  partId: Joi.string().required(),
  condition: Joi.string().valid('good', 'worn', 'replace').required(),
  notes: Joi.string().optional().trim().max(1000),
  photos: Joi.array().items(Joi.string()).optional()
});

// @route   POST /api/inspections
// @desc    Create new inspection (Inspector only)
// @access  Private (Inspector)
router.post('/', authenticate, authorize('inspector'), async (req, res) => {
  try {
    const { error, value } = createInspectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { partId, condition, notes, photos = [] } = value;

    // Check if part exists
    const part = await Part.findOne({ id: partId.toUpperCase() });
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }

    // Check if part is installed
    if (!part.isInstalled) {
      return res.status(400).json({
        success: false,
        message: 'Part must be installed before inspection'
      });
    }

    // Generate inspection ID
    const inspectionId = `INS${Date.now()}`;

    // Create inspection
    const inspection = new Inspection({
      id: inspectionId,
      partId: part.id,
      inspectorId: req.user.id,
      condition,
      notes,
      photos,
      inspectionDate: new Date()
      // nextInspectionDue will be calculated automatically by the pre-save hook
    });

    await inspection.save();

    // Populate the inspection with part data
    await inspection.populate('partId');

    res.status(201).json({
      success: true,
      data: inspection,
      message: 'Inspection created successfully'
    });

  } catch (error) {
    console.error('Create inspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating inspection'
    });
  }
});

// @route   GET /api/inspections
// @desc    Get all inspections with filtering
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      condition, 
      partId,
      inspectorId 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};

    // Role-based filtering
    if (req.user.role === 'inspector') {
      query.inspectorId = req.user.id;
    }

    // Apply filters
    if (condition) {
      query.condition = condition;
    }

    if (partId) {
      query.partId = partId;
    }

    if (inspectorId && req.user.role === 'admin') {
      query.inspectorId = inspectorId;
    }

    const inspections = await Inspection.find(query)
      .populate('partId', 'partName lotNumber installationData')
      .sort({ inspectionDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Inspection.countDocuments(query);

    res.json({
      success: true,
      data: {
        inspections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Inspections retrieved successfully'
    });

  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving inspections'
    });
  }
});

// @route   GET /api/inspections/:id
// @desc    Get inspection by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.findOne({ id: req.params.id.toUpperCase() })
      .populate('partId', 'partName lotNumber installationData warrantyExpiryDate')
      .populate('inspectorId', 'firstName lastName');

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'inspector' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: inspection,
      message: 'Inspection retrieved successfully'
    });

  } catch (error) {
    console.error('Get inspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving inspection'
    });
  }
});

// @route   GET /api/inspections/part/:partId
// @desc    Get inspection history for a specific part
// @access  Private
router.get('/part/:partId', authenticate, async (req, res) => {
  try {
    const { partId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Check if part exists
    const part = await Part.findOne({ id: partId.toUpperCase() });
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }

    const inspections = await Inspection.find({ partId: part.id })
      .populate('inspectorId', 'firstName lastName')
      .sort({ inspectionDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Inspection.countDocuments({ partId: part.id });

    res.json({
      success: true,
      data: {
        part: {
          id: part.id,
          partName: part.partName,
          lotNumber: part.lotNumber,
          installationData: part.installationData
        },
        inspections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Part inspection history retrieved successfully'
    });

  } catch (error) {
    console.error('Get part inspection history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving part inspection history'
    });
  }
});

// @route   GET /api/inspections/defects
// @desc    Get parts that need replacement (condition = 'replace')
// @access  Private
router.get('/defects', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const inspections = await Inspection.find({ condition: 'replace' })
      .populate('partId', 'partName lotNumber installationData warrantyExpiryDate')
      .populate('inspectorId', 'firstName lastName')
      .sort({ inspectionDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Inspection.countDocuments({ condition: 'replace' });

    res.json({
      success: true,
      data: {
        inspections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Defect reports retrieved successfully'
    });

  } catch (error) {
    console.error('Get defect reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving defect reports'
    });
  }
});

// @route   GET /api/inspections/schedule
// @desc    Get upcoming inspections based on nextInspectionDue
// @access  Private
router.get('/schedule', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, days = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const today = new Date();
    const futureDate = new Date(today.getTime() + (Number(days) * 24 * 60 * 60 * 1000));

    // Get inspections that are due within the specified days
    const inspections = await Inspection.find({
      nextInspectionDue: {
        $gte: today,
        $lte: futureDate
      }
    })
      .populate('partId', 'partName lotNumber installationData')
      .populate('inspectorId', 'firstName lastName')
      .sort({ nextInspectionDue: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Inspection.countDocuments({
      nextInspectionDue: {
        $gte: today,
        $lte: futureDate
      }
    });

    res.json({
      success: true,
      data: {
        inspections,
        scheduleInfo: {
          days: Number(days),
          from: today,
          to: futureDate
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Inspection schedule retrieved successfully'
    });

  } catch (error) {
    console.error('Get inspection schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving inspection schedule'
    });
  }
});

export default router;
