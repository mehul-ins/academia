const csv = require('csv-parser');
const { Readable } = require('stream');
const crypto = require('crypto');
const axios = require('axios');
const { Certificate, Log } = require('../models');

// Environment variables
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:8080';

/**
 * Bulk Certificate Upload Endpoint
 * Handles CSV upload, parsing, database operations, and blockchain integration
 */
exports.bulkUpload = async (req, res) => {
    let logData = {
        action: 'BULK_CERTIFICATE_UPLOAD',
        userId: req.user ? req.user.id : null,
        userEmail: req.user ? req.user.email : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        status: 'PENDING'
    };

    try {
        // Check if file was uploaded
        if (!req.file) {
            logData.status = 'FAILED';
            logData.details = { error: 'No CSV file uploaded' };
            await Log.create(logData);

            return res.status(400).json({
                status: 'error',
                message: 'No CSV file uploaded',
                summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
            });
        }

        // Validate file type
        if (req.file.mimetype !== 'text/csv' && !req.file.originalname.toLowerCase().endsWith('.csv')) {
            logData.status = 'FAILED';
            logData.details = { error: 'Invalid file type. Only CSV files are allowed.' };
            await Log.create(logData);

            return res.status(400).json({
                status: 'error',
                message: 'Invalid file type. Only CSV files are allowed.',
                summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
            });
        }

        // Log file details
        logData.details = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };

        console.log('Processing CSV file:', req.file.originalname);

        // Parse CSV data
        const csvData = [];
        const errors = [];

        await new Promise((resolve, reject) => {
            const stream = Readable.from(req.file.buffer);
            let rowNumber = 0;

            stream
                .pipe(csv({
                    skipEmptyLines: true,
                    strict: false
                }))
                .on('data', (row) => {
                    rowNumber++;

                    // Validate required fields
                    if (!row.certificateId || !row.studentName || !row.courseName) {
                        errors.push({
                            row: rowNumber,
                            data: row,
                            error: 'Missing required fields (certificateId, studentName, courseName)'
                        });
                        return;
                    }

                    // Clean and format data
                    const cleanRow = {
                        certificateId: row.certificateId.trim(),
                        studentName: row.studentName.trim(),
                        rollNumber: row.rollNumber ? row.rollNumber.trim() : 'N/A',
                        course: row.courseName.trim(),
                        institution: row.institutionName ? row.institutionName.trim() : 'Default Institution',
                        issueDate: row.issueDate ? new Date(row.issueDate) : new Date(),
                        grade: row.grade ? row.grade.trim() : 'A',
                        additionalData: row.additionalData ? row.additionalData : null,
                        rowNumber: rowNumber
                    };

                    csvData.push(cleanRow);
                })
                .on('end', () => {
                    console.log(`CSV parsing complete. Found ${csvData.length} valid rows, ${errors.length} errors.`);
                    resolve();
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error);
                    reject(error);
                });
        });

        // Initialize counters
        let total = csvData.length;
        let inserted = 0;
        let updated = 0;
        let failed = errors.length;
        const failedRecords = [...errors];

        // Process each valid CSV row
        for (const row of csvData) {
            try {
                // Check if certificate already exists
                const existingCert = await Certificate.findOne({
                    where: { certificateId: row.certificateId }
                });

                let certificate;
                if (existingCert) {
                    // Update existing certificate
                    await existingCert.update({
                        studentName: row.studentName,
                        rollNumber: row.rollNumber,
                        course: row.course,
                        institution: row.institution,
                        grade: row.grade
                    });
                    certificate = existingCert;
                    updated++;
                    console.log(`Updated certificate: ${row.certificateId}`);
                } else {
                    // Insert new certificate
                    certificate = await Certificate.create(row);
                    inserted++;
                    console.log(`Inserted new certificate: ${row.certificateId}`);
                }

                // Compute hash for blockchain
                const certificateData = {
                    certificateId: certificate.certificateId,
                    studentName: certificate.studentName,
                    rollNumber: certificate.rollNumber,
                    course: certificate.course,
                    issueDate: certificate.issueDate.toISOString(),
                    grade: certificate.grade
                };

                const hash = crypto
                    .createHash('sha256')
                    .update(JSON.stringify(certificateData))
                    .digest('hex');

                // Store hash on blockchain
                try {
                    await axios.post(`${BLOCKCHAIN_SERVICE_URL}/api/store-hash`, {
                        certId: certificate.certificateId,
                        hash: hash,
                        issuer: req.user.email || 'system'
                    }, {
                        timeout: 10000 // 10 second timeout
                    });

                    console.log(`Blockchain hash stored for certificate: ${certificate.certificateId}`);
                } catch (blockchainError) {
                    console.error(`Blockchain storage failed for ${certificate.certificateId}:`, blockchainError.message);
                    // Don't fail the entire operation if blockchain is unavailable
                    // The certificate is still valid in the database
                }

            } catch (dbError) {
                console.error(`Database operation failed for row ${row.rowNumber}:`, dbError.message);
                failed++;
                failedRecords.push({
                    row: row.rowNumber,
                    data: row,
                    error: `Database error: ${dbError.message}`
                });

                // If this was an insert that failed, decrease the inserted counter
                if (!await Certificate.findOne({ where: { certificateId: row.certificateId } })) {
                    // Certificate doesn't exist, so it was a failed insert
                    // (no action needed, already counted in failed)
                } else {
                    // Certificate exists, so it was a failed update
                    updated--;
                }
            }
        }

        // Log the operation result
        logData.status = 'COMPLETED';
        logData.details.summary = { total, inserted, updated, failed };
        logData.details.failedRecords = failedRecords;
        await Log.create(logData);

        // Return summary
        return res.status(200).json({
            status: 'success',
            message: 'Bulk certificate upload completed',
            summary: {
                total: total,
                inserted: inserted,
                updated: updated,
                failed: failed
            },
            errors: failedRecords.length > 0 ? failedRecords : undefined
        });

    } catch (error) {
        console.error('Bulk upload error:', error);

        logData.status = 'ERROR';
        logData.details.error = error.message;
        await Log.create(logData);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during bulk upload',
            summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
        });
    }
};

/**
 * Get all certificates (with pagination)
 */
exports.getAllCertificates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Certificate.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            status: 'success',
            data: {
                certificates: rows,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalRecords: count,
                    hasNext: page < Math.ceil(count / limit),
                    hasPrev: page > 1
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
};

/**
 * Get certificate by ID
 */
exports.getCertificateById = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({
            where: { certificateId: certificateId }
        });

        if (!certificate) {
            return res.status(404).json({
                status: 'error',
                message: 'Certificate not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: { certificate }
        });
    } catch (error) {
        console.error('Get certificate error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

/**
 * Delete certificate
 */
exports.deleteCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({
            where: { certificateId: certificateId }
        });

        if (!certificate) {
            return res.status(404).json({
                status: 'error',
                message: 'Certificate not found'
            });
        }

        await certificate.destroy();

        // Log the deletion
        await Log.create({
            action: 'CERTIFICATE_DELETION',
            userId: req.user.id,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date(),
            status: 'COMPLETED',
            details: { certificateId: certificateId }
        });

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
};