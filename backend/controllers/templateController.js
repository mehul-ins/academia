const supabase = require('../utils/supabaseClient');
const path = require('path');

/**
 * Upload certificate template (PDF/DOCX) for an institute
 * @route POST /api/certificates/template
 * @access Protected (institution only)
 */
exports.uploadTemplate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No template file uploaded'
            });
        }
        const userId = req.user.id;
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (!['.pdf', '.docx'].includes(ext)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file type. Only PDF and DOCX are allowed.'
            });
        }
        // Store in Supabase Storage (bucket: 'templates')
        const filePath = `institute_${userId}/${Date.now()}_${req.file.originalname}`;
        const { data, error } = await supabase.storage
            .from('templates')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });
        if (error) throw error;
        // Optionally, store template metadata in DB
        await supabase.from('certificate_templates').insert([
            {
                userId,
                fileName: req.file.originalname,
                filePath,
                uploadedAt: new Date().toISOString()
            }
        ]);
        return res.status(201).json({
            status: 'success',
            message: 'Template uploaded successfully',
            filePath
        });
    } catch (error) {
        console.error('Template upload error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during template upload'
        });
    }
};

/**
 * List all templates for the current institute
 * @route GET /api/certificates/templates
 * @access Protected (institution only)
 */
exports.listTemplates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('certificate_templates')
            .select('*')
            .eq('userId', userId)
            .order('uploadedAt', { ascending: false });
        if (error) throw error;
        return res.status(200).json({
            status: 'success',
            templates: data
        });
    } catch (error) {
        console.error('List templates error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during template listing'
        });
    }
};
