const crypto = require('crypto');
const { Certificate } = require('../models');
const { Op } = require('sequelize');
const blockchainClient = require('../utils/blockchainClient');
const Joi = require('joi');

// Validation schema for certificate data
const certificateSchema = Joi.object({
    certId: Joi.string().required(),
    name: Joi.string().required(),
    roll: Joi.string().required(),
    course: Joi.string().required(),
    institution: Joi.string().required()
});

const certificateController = {
    bulkUpload: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No CSV file uploaded'
                });
            }

            // Parse CSV data
            const csvData = req.file.buffer.toString('utf8');
            const lines = csvData.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                return res.status(400).json({
                    status: 'error',
                    message: 'CSV file must contain headers and at least one data row'
                });
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const dataRows = lines.slice(1);

            // Validate headers
            const requiredHeaders = ['certId', 'name', 'roll', 'course', 'institution'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

            if (missingHeaders.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: `Missing required headers: ${missingHeaders.join(', ')}`
                });
            }

            let total = 0;
            let inserted = 0;
            let updated = 0;
            let failed = 0;
            const errors = [];

            // Process each row
            for (let i = 0; i < dataRows.length; i++) {
                const rowNumber = i + 2; // +2 because we start from 1 and skip header
                const values = dataRows[i].split(',').map(v => v.trim());

                if (values.length !== headers.length) {
                    errors.push(`Row ${rowNumber}: Column count mismatch`);
                    failed++;
                    continue;
                }

                // Create certificate object
                const certificateData = {};
                headers.forEach((header, index) => {
                    certificateData[header] = values[index];
                });

                // Validate data
                const { error, value } = certificateSchema.validate(certificateData);
                if (error) {
                    errors.push(`Row ${rowNumber}: ${error.details[0].message}`);
                    failed++;
                    continue;
                }

                try {
                    total++;

                    // Compute hash for blockchain
                    const hash = crypto
                        .createHash('sha256')
                        .update(JSON.stringify(value))
                        .digest('hex');

                    // Check if certificate already exists
                    const existingCert = await Certificate.findOne({
                        where: { certId: value.certId }
                    });

                    if (existingCert) {
                        // Update existing certificate
                        await existingCert.update({
                            ...value,
                            hash: hash
                        });
                        updated++;
                    } else {
                        // Create new certificate
                        await Certificate.create({
                            ...value,
                            hash: hash,
                            onChain: false
                        });
                        inserted++;
                    }

                    // Store hash on blockchain (async, don't wait)
                    blockchainClient.storeHash(value.certId, hash, value.institution)
                        .then(result => {
                            if (result.success) {
                                // Update onChain status
                                Certificate.update(
                                    { onChain: true },
                                    { where: { certId: value.certId } }
                                );
                            }
                        })
                        .catch(err => {
                            console.error(`Blockchain storage failed for ${value.certId}:`, err);
                        });

                } catch (dbError) {
                    console.error(`Database error for row ${rowNumber}:`, dbError);
                    errors.push(`Row ${rowNumber}: Database error - ${dbError.message}`);
                    failed++;
                }
            }

            return res.status(200).json({
                status: 'success',
                data: {
                    total,
                    inserted,
                    updated,
                    failed,
                    errors: errors.slice(0, 10) // Limit to first 10 errors
                }
            });

        } catch (error) {
            console.error('Bulk upload error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error during bulk upload'
            });
        }
    },

    getCertificates: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { search, status } = req.query;

            // Build where clause
            const whereClause = {};
            if (search) {
                whereClause[Op.or] = [
                    { certId: { [Op.like]: `%${search}%` } },
                    { name: { [Op.like]: `%${search}%` } },
                    { roll: { [Op.like]: `%${search}%` } }
                ];
            }
            if (status) {
                whereClause.status = status;
            }

            const { count, rows } = await Certificate.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    certificates: rows,
                    pagination: {
                        total: count,
                        page,
                        limit,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get certificates error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    deleteCertificate: async (req, res) => {
        try {
            const { certId } = req.params;

            const certificate = await Certificate.findOne({
                where: { certId }
            });

            if (!certificate) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Certificate not found'
                });
            }

            await certificate.destroy();

            return res.status(200).json({
                status: 'success',
                message: 'Certificate deleted successfully'
            });

        } catch (error) {
            console.error('Delete certificate error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
};

module.exports = certificateController;