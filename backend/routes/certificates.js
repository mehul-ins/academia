const express = require('express');
const multer = require('multer');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Configure Multer for CSV file upload
const storage = multer.memoryStorage(); // Store files in memory for processing

const csvFileFilter = (req, file, cb) => {
    // Accept only CSV files
    const allowedTypes = [
        'text/csv',
        'application/csv',
        'text/plain' // Some systems may send CSV as text/plain
    ];

    // Also check file extension
    const isCSV = allowedTypes.includes(file.mimetype) ||
        file.originalname.toLowerCase().endsWith('.csv');

    if (isCSV) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
};

const csvUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for CSV files
        files: 1 // Only allow one file
    },
    fileFilter: csvFileFilter
});

/**
 * @route   POST /api/certificates/bulk
 * @desc    Bulk upload certificates from CSV file
 * @access  Protected (Admin only)
 * @body    file: CSV file with certificate data
 */
router.post('/bulk',
    authMiddleware,
    roleMiddleware('admin'),
    csvUpload.single('csvFile'),
    (req, res, next) => {
        // Handle multer errors
        if (req.multerError) {
            return res.status(400).json({
                status: 'error',
                message: `File upload error: ${req.multerError}`,
                summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
            });
        }

        // Call the certificate controller
        certificateController.bulkUpload(req, res, next);
    }
);

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates with pagination
 * @access  Protected
 * @query   page: Page number (default: 1)
 * @query   limit: Records per page (default: 10)
 */
router.get('/', authMiddleware, certificateController.getAllCertificates);

/**
 * @route   GET /api/certificates/:certificateId
 * @desc    Get certificate by ID
 * @access  Protected
 */
router.get('/:certificateId', authMiddleware, certificateController.getCertificateById);

/**
 * @route   DELETE /api/certificates/:certificateId
 * @desc    Delete certificate
 * @access  Protected (Admin only)
 */
router.delete('/:certificateId',
    authMiddleware,
    roleMiddleware('admin'),
    certificateController.deleteCertificate
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        let message;
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File too large. Maximum size is 5MB for CSV files.';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files. Only one CSV file is allowed.';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field. Use "csvFile" as the field name.';
                break;
            default:
                message = `Upload error: ${error.message}`;
        }

        return res.status(400).json({
            status: 'error',
            message: message,
            summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
        });
    }

    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
            summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
        });
    }

    // Pass other errors to the default error handler
    next(error);
});

module.exports = router;