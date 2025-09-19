const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validation = require('../middleware/validation');
const certificateController = require('../controllers/certificateController');

const router = express.Router();

// Configure Multer for CSV upload
const storage = multer.memoryStorage();

const csvFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for CSV
        files: 1
    },
    fileFilter: csvFilter
});

/**
 * @route   POST /api/certificates/bulk
 * @desc    Bulk upload certificates from CSV
 * @access  Admin only
 */
router.post('/bulk',
    authMiddleware,
    roleMiddleware(['admin']),
    upload.single('csvFile'),
    validation.validateFileUpload(['text/csv'], 10 * 1024 * 1024),
    certificateController.bulkUpload
);

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates with pagination
 * @access  Admin only
 */
router.get('/',
    authMiddleware,
    roleMiddleware(['admin']),
    validation.validateQuery(validation.schemas.search),
    certificateController.getCertificates
);

/**
 * @route   DELETE /api/certificates/:certId
 * @desc    Delete a certificate
 * @access  Admin only
 */
router.delete('/:certId',
    authMiddleware,
    roleMiddleware(['admin']),
    validation.validateParams(validation.schemas.certIdParam),
    certificateController.deleteCertificate
);

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