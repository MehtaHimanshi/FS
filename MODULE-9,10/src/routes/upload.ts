import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, 'inspections');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

// @route   POST /api/upload/inspection-photos
// @desc    Upload inspection photos (Inspector only)
// @access  Private (Inspector)
router.post('/inspection-photos', 
  authenticate, 
  authorize('inspector'), 
  upload.array('photos', 5),
  async (req, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const files = req.files as Express.Multer.File[];
      
      // Validate file types and sizes
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');

      for (const file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          // Delete uploaded files if validation fails
          files.forEach(f => {
            const filePath = path.join(f.destination, f.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
          
          return res.status(400).json({
            success: false,
            message: 'Only JPEG, PNG, and WebP images are allowed'
          });
        }

        if (file.size > maxSize) {
          // Delete uploaded files if validation fails
          files.forEach(f => {
            const filePath = path.join(f.destination, f.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
          
          return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum allowed size'
          });
        }
      }

      // Prepare response with file URLs
      const uploadedFiles = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/inspections/${file.filename}`,
        uploadedAt: new Date().toISOString()
      }));

      res.json({
        success: true,
        data: {
          files: uploadedFiles,
          count: files.length
        },
        message: `${files.length} photo(s) uploaded successfully`
      });

    } catch (error) {
      console.error('Upload photos error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        (req.files as Express.Multer.File[]).forEach(file => {
          const filePath = path.join(file.destination, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error uploading photos'
      });
    }
  }
);

// @route   DELETE /api/upload/inspection-photos/:filename
// @desc    Delete inspection photo
// @access  Private (Inspector, Admin)
router.delete('/inspection-photos/:filename', 
  authenticate, 
  authorize('inspector', 'admin'),
  async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename'
        });
      }

      const filePath = path.join(uploadsDir, 'inspections', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Delete the file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });

    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error deleting photo'
      });
    }
  }
);

// @route   GET /api/upload/inspection-photos/:filename
// @desc    Serve inspection photo
// @access  Private
router.get('/inspection-photos/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filePath = path.join(uploadsDir, 'inspections', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Serve photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error serving photo'
    });
  }
});

// Error handling middleware for multer
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

export default router;
