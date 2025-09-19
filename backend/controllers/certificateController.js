const csv = require('csv-parser');
const { Readable } = require('stream');
const crypto = require('crypto');
const axios = require('axios');
const supabase = require('../utils/supabaseClient');

// Environment variables
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:8080';

/**
 * Bulk Certificate Upload Endpoint
 * Handles CSV upload, parsing, database operations, and blockchain integration
 */

exports.bulkUpload = async (req, res) => {
    let csvData = [];
    let errors = [];
    const MAX_TIMEOUT_MS = 25000;
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error('Bulk upload timed out. Please try a smaller file or check your network.'));
        }, MAX_TIMEOUT_MS);
    });
    try {
        if (!req.file) {
            clearTimeout(timeoutHandle);
            return res.status(400).json({
                status: 'error',
                message: 'No CSV file uploaded',
                summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
            });
        }
        if (req.file.mimetype !== 'text/csv' && !req.file.originalname.toLowerCase().endsWith('.csv')) {
            clearTimeout(timeoutHandle);
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file type. Only CSV files are allowed.',
                summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
            });
        }
        if (!req.user || !req.user.email) {
            clearTimeout(timeoutHandle);
            return res.status(401).json({
                status: 'error',
                message: 'Authentication/session expired. Please log in again.',
                summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
            });
        }
        // CSV parsing and mapping
        let rowNumber = 0;
        await Promise.race([
            new Promise((resolve) => {
                const stream = Readable.from(req.file.buffer);
                stream
                    .pipe(csv({ skipEmptyLines: true, strict: false }))
                    .on('data', (row) => {
                        rowNumber++;
                        // Normalize keys: trim whitespace from all keys
                        const normalizedRow = {};
                        Object.keys(row).forEach(key => {
                            normalizedRow[key.trim()] = row[key];
                        });
                        const mapField = (row, keys) => {
                            for (const key of keys) {
                                if (row[key] && row[key].trim() !== '') return row[key].trim();
                            }
                            return undefined;
                        };
                        // Use roll_number as the unique identifier
                        const roll_number = mapField(normalizedRow, ['Roll Number', 'rollNumber', 'roll_number', 'certificateId', 'ID', 'id']);
                        const student_name = mapField(normalizedRow, ['studentName', 'Name', 'name', 'student_name']);
                        const course_name = mapField(normalizedRow, ['courseName', 'Course', 'course', 'course_name']);
                        const grade = mapField(normalizedRow, ['grade', 'CGPA', 'Marks', 'marks', 'Percentage', 'percentage', 'GPA']);
                        const issue_date = mapField(normalizedRow, ['issueDate', 'Issued Year', 'issued_year', 'Year', 'year']);
                        const institution = mapField(normalizedRow, ['institutionName', 'Institution', 'institution']);
                        console.log(`Row ${rowNumber} mapping:`, { roll_number, student_name, course_name, row: normalizedRow });
                        if (!student_name || !course_name) {
                            const missing = [];
                            if (!student_name) missing.push('student_name');
                            if (!course_name) missing.push('course_name');
                            errors.push({ row: rowNumber, data: normalizedRow, error: `Missing required fields: ${missing.join(', ')}` });
                            console.error(`Row ${rowNumber} skipped: missing ${missing.join(', ')}`);
                            return;
                        }
                        const cleanRow = {
                            student_name,
                            roll_number,
                            course_name,
                            institution: institution || 'Default Institution',
                            issue_date: issue_date ? new Date(issue_date) : new Date(),
                            grade: grade || '',
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
                        resolve(); // Always resolve to avoid hanging
                    });
                setTimeout(() => {
                    resolve();
                }, 5000);
            }),
            timeoutPromise
        ]);
        clearTimeout(timeoutHandle);
        let total = csvData.length;
        let inserted = 0;
        let updated = 0;
        let failed = errors.length;
        const failedRecords = [...errors];
        for (const row of csvData) {
            try {
                // Try to update by certificate_id if present, else by roll_number if present, else always insert
                let existingCert = null;
                let findError = null;
                if (row.roll_number) {
                    const result = await supabase
                        .from('certificates')
                        .select('*')
                        .eq('roll_number', row.roll_number)
                        .maybeSingle();
                    existingCert = result.data;
                    findError = result.error;
                }
                if (findError) throw findError;
                let certificate;
                // Prepare DB payload without rowNumber
                const dbPayload = {
                    student_name: row.student_name,
                    roll_number: row.roll_number,
                    course_name: row.course_name,
                    institution: row.institution,
                    issue_date: row.issue_date,
                    grade: row.grade
                };
                if (existingCert) {
                    // Update existing by roll_number
                    const updateQuery = supabase
                        .from('certificates')
                        .update(dbPayload)
                        .eq('roll_number', row.roll_number);
                    const { data: updatedCert, error: updateError } = await updateQuery.select().single();
                    if (updateError) throw updateError;
                    certificate = updatedCert;
                    updated++;
                    console.log(`Updated certificate: ${row.roll_number}`);
                } else {
                    const { data: insertedCert, error: insertError } = await supabase
                        .from('certificates')
                        .insert([dbPayload])
                        .select()
                        .single();
                    if (insertError) throw insertError;
                    certificate = insertedCert;
                    inserted++;
                    console.log(`Inserted new certificate: ${row.roll_number}`);
                }
                const certificateData = {
                    roll_number: certificate.roll_number,
                    student_name: certificate.student_name,
                    course_name: certificate.course_name,
                    issue_date: certificate.issue_date ? new Date(certificate.issue_date).toISOString() : '',
                    grade: certificate.grade
                };
                const hash = crypto
                    .createHash('sha256')
                    .update(JSON.stringify(certificateData))
                    .digest('hex');
                axios.post(`${BLOCKCHAIN_SERVICE_URL}/api/store-hash`, {
                    certId: certificate.roll_number,
                    hash: hash,
                    issuer: req.user && req.user.email ? req.user.email : 'system'
                }, {
                    timeout: 10000
                })
                    .then(() => {
                        console.log(`Blockchain hash stored for certificate: ${certificate.roll_number}`);
                    })
                    .catch((blockchainError) => {
                        console.error(`Blockchain storage failed for ${certificate.roll_number}:`, blockchainError.message);
                    });
            } catch (dbError) {
                console.error(`Database operation failed for row ${row.rowNumber}:`, dbError.message);
                failed++;
                failedRecords.push({
                    row: row.rowNumber,
                    data: row,
                    error: `Database error: ${dbError.message}`
                });
            }
        }
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
        if (timeoutHandle) clearTimeout(timeoutHandle);
        console.error('Bulk upload error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error during bulk upload',
            summary: { total: 0, inserted: 0, updated: 0, failed: 0 }
        });
    }
};

exports.getAllCertificates = async (req, res) => {
    // ...existing code for getAllCertificates...
};

exports.getCertificateById = async (req, res) => {
    // ...existing code for getCertificateById...
};

exports.deleteCertificate = async (req, res) => {
    // ...existing code for deleteCertificate...
};

/**
 * Get all certificates (with pagination)
 */
exports.getAllCertificates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get certificates with Supabase
        const { data: certificates, error: certsError, count } = await supabase
            .from('certificates')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (certsError) {
            console.error('Error fetching certificates:', certsError);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch certificates'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: {
                certificates: certificates || [],
                pagination: {
                    currentPage: page,
                    totalPages: count ? Math.ceil(count / limit) : 0,
                    totalRecords: count || 0,
                    hasNext: count ? page < Math.ceil(count / limit) : false,
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

        const { data: certificate, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('certificate_id', certificateId)
            .single();

        if (error) {
            return res.status(404).json({
                status: 'error',
                message: 'Certificate not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: certificate
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

        const { data: certificate, error: findError } = await supabase
            .from('certificates')
            .select('*')
            .eq('certificate_id', certificateId)
            .single();

        if (findError || !certificate) {
            return res.status(404).json({
                status: 'error',
                message: 'Certificate not found'
            });
        }

        const { error: deleteError } = await supabase
            .from('certificates')
            .delete()
            .eq('certificate_id', certificateId);

        if (deleteError) {
            throw deleteError;
        }

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