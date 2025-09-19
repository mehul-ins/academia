const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const verifyController = require('../controllers/verifyController');

const router = express.Router();

// Configure Multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept common image and PDF formats
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: fileFilter
});

// Rate limiting for verification endpoint
const verifyRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many verification requests, please try again later.'
    }
});

/**
 * @route   POST /api/verify
 * @desc    Verify certificate authenticity
 * @access  Public
 */
router.post('/', verifyRateLimit, upload.single('certificate'), verifyController.verifyCertificate);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        let message;
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File too large. Maximum size is 5MB.';
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
            status: 'error',
            message: message
        });
    }

    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            status: 'error',
            message: error.message
        });
    }

    next(error);
});

module.exports = router;