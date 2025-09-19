const express = require('express');
const multer = require('multer');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer for file upload
const storage = multer.memoryStorage(); // Store files in memory for processing

const fileFilter = (req, file, cb) => {
    // Accept common image and PDF formats
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, BMP, WebP) and PDF files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only allow one file
    },
    fileFilter: fileFilter
});

/**
 * @route   POST /api/verify
 * @desc    Verify certificate authenticity
 * @access  Public (no authentication required)
 * @body    file: Certificate image/PDF file
 */
router.post('/', upload.single('certificate'), (req, res, next) => {
    // Handle multer errors
    if (req.multerError) {
        return res.status(400).json({
            status: 'Invalid',
            reasons: [`File upload error: ${req.multerError}`],
            certificate: null
        });
    }

    // Call the verification controller
    verifyController.verifyCertificate(req, res, next);
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        let message;
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File too large. Maximum size is 10MB.';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files. Only one file is allowed.';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field. Use "certificate" as the field name.';
                break;
            default:
                message = `Upload error: ${error.message}`;
        }

        return res.status(400).json({
            status: 'Invalid',
            reasons: [message],
            certificate: null
        });
    }

    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            status: 'Invalid',
            reasons: [error.message],
            certificate: null
        });
    }

    // Pass other errors to the default error handler
    next(error);
});

module.exports = router;