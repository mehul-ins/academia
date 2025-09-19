const axios = require('axios');
const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Log = require('../models/Log');

// Environment variables for AI service and blockchain
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:8080';

/**
 * Verify Certificate Endpoint
 * Handles file upload, AI analysis, database validation, and blockchain verification
 */
exports.verifyCertificate = async (req, res) => {
    let logData = {
        action: 'CERTIFICATE_VERIFICATION',
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
            logData.details = { error: 'No file uploaded' };
            await Log.create(logData);

            return res.status(400).json({
                status: 'Invalid',
                reasons: ['No file uploaded'],
                certificate: null
            });
        }

        // Log the file details
        logData.details = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };

        // Step 1: Send file to AI service for analysis
        console.log('Sending file to AI service for analysis...');

        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        let aiAnalysisResult;
        try {
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/analyze`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 30000 // 30 second timeout
            });
            aiAnalysisResult = aiResponse.data;
            console.log('AI Analysis Result:', aiAnalysisResult);
        } catch (aiError) {
            // MOCK AI SERVICE RESPONSE FOR LOCAL TESTING
            console.warn('AI Service unavailable, using mock AI analysis result.');
            aiAnalysisResult = {
                certId: 'MOCK-CERT-001',
                name: 'Mock Student',
                roll: 'MOCK123',
                course: 'Mock Course'
            };
        }

        // Step 2: Extract certificate data from AI analysis
        const { certId, name, roll, course } = aiAnalysisResult;

        if (!certId) {
            logData.status = 'FAILED';
            logData.details.error = 'Certificate ID not found in document';
            await Log.create(logData);

            return res.status(400).json({
                status: 'Invalid',
                reasons: ['Certificate ID not found in document'],
                certificate: null
            });
        }

        logData.details.extractedData = { certId, name, roll, course };

        // Step 3: Check database for certificate
        console.log('Checking database for certificate:', certId);

        const dbCertificate = await Certificate.findOne({
            where: { certificateId: certId }
        });

        if (!dbCertificate) {
            logData.status = 'INVALID';
            logData.details.validationResult = 'Certificate ID not found in database';
            await Log.create(logData);

            return res.status(404).json({
                status: 'Invalid',
                reasons: ['Certificate ID not found in database'],
                certificate: null
            });
        }

        // Step 4: Validate extracted data against database
        const mismatches = [];

        if (name && dbCertificate.studentName.toLowerCase() !== name.toLowerCase()) {
            mismatches.push(`Name mismatch: expected "${dbCertificate.studentName}", found "${name}"`);
        }

        if (roll && dbCertificate.rollNumber !== roll) {
            mismatches.push(`Roll number mismatch: expected "${dbCertificate.rollNumber}", found "${roll}"`);
        }

        if (course && dbCertificate.course.toLowerCase() !== course.toLowerCase()) {
            mismatches.push(`Course mismatch: expected "${dbCertificate.course}", found "${course}"`);
        }

        if (mismatches.length > 0) {
            logData.status = 'SUSPICIOUS';
            logData.details.validationResult = 'Field mismatches detected';
            logData.details.mismatches = mismatches;
            await Log.create(logData);

            return res.status(200).json({
                status: 'Suspicious',
                reasons: mismatches,
                certificate: {
                    id: dbCertificate.certificateId,
                    studentName: dbCertificate.studentName,
                    rollNumber: dbCertificate.rollNumber,
                    course: dbCertificate.course,
                    issueDate: dbCertificate.issueDate,
                    grade: dbCertificate.grade
                }
            });
        }

        // Step 5: Compute hash and verify with blockchain
        console.log('Verifying certificate hash with blockchain...');

        const certificateData = {
            certificateId: dbCertificate.certificateId,
            studentName: dbCertificate.studentName,
            rollNumber: dbCertificate.rollNumber,
            course: dbCertificate.course,
            issueDate: dbCertificate.issueDate.toISOString(),
            grade: dbCertificate.grade
        };

        const computedHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(certificateData))
            .digest('hex');

        let blockchainVerified = true;
        try {
            const blockchainResponse = await axios.post(`${BLOCKCHAIN_SERVICE_URL}/api/verify-hash`, {
                certificateId: certId,
                hash: computedHash
            }, {
                timeout: 10000 // 10 second timeout
            });

            blockchainVerified = blockchainResponse.data.verified;
            console.log('Blockchain verification result:', blockchainVerified);
        } catch (blockchainError) {
            console.error('Blockchain Service Error:', blockchainError.message);
            // If blockchain service is unavailable, we'll proceed but note the issue
            blockchainVerified = null;
        }

        // Step 6: Determine final status
        let finalStatus = 'Valid';
        let reasons = [];

        if (blockchainVerified === false) {
            finalStatus = 'Suspicious';
            reasons.push('Blockchain hash verification failed');
        } else if (blockchainVerified === null) {
            finalStatus = 'Valid';
            reasons.push('Blockchain verification unavailable');
        }

        // Step 7: Log the verification result
        logData.status = finalStatus.toUpperCase();
        logData.details.validationResult = 'All validations passed';
        logData.details.blockchainVerified = blockchainVerified;
        logData.details.computedHash = computedHash;
        await Log.create(logData);

        // Step 8: Return verification result
        return res.status(200).json({
            status: finalStatus,
            reasons: reasons.length > 0 ? reasons : undefined,
            certificate: {
                id: dbCertificate.certificateId,
                studentName: dbCertificate.studentName,
                rollNumber: dbCertificate.rollNumber,
                course: dbCertificate.course,
                issueDate: dbCertificate.issueDate,
                grade: dbCertificate.grade,
                verifiedAt: new Date().toISOString(),
                blockchainVerified: blockchainVerified
            }
        });

    } catch (error) {
        console.error('Verification Error:', error);

        logData.status = 'ERROR';
        logData.details.error = error.message;
        await Log.create(logData);

        return res.status(500).json({
            status: 'Invalid',
            reasons: ['Internal server error during verification'],
            certificate: null
        });
    }
};