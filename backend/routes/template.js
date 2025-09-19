const express = require('express');
const multer = require('multer');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Configure Multer for template file upload
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'), false);
    }
};
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

// POST /api/certificates/template - Upload template
router.post('/template', authMiddleware, roleMiddleware('institution'), upload.single('template'), (req, res, next) => {
    if (req.multerError) {
        return res.status(400).json({ status: 'error', message: `File upload error: ${req.multerError}` });
    }
    templateController.uploadTemplate(req, res, next);
});

// GET /api/certificates/templates - List templates
router.get('/templates', authMiddleware, roleMiddleware('institution'), templateController.listTemplates);

module.exports = router;
