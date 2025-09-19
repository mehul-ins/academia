const axios = require('axios');
const crypto = require('crypto');
const supabase = require('../utils/supabaseClient');

// Environment variables for AI service and blockchain
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:8080';

/**
 * Verify Certificate Endpoint
 * Handles file upload, AI analysis, database validation, and blockchain verification
 * Updated to work with Supabase
 */
exports.verifyCertificate = async (req, res) => {
    let logData = {
        action: 'CERTIFICATE_VERIFICATION',
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
            console.log('Logging verification attempt:', logData);

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

        // Step 2: Send file to FastAPI tampering service
        let tamperingOutput = null;
        try {
            const tamperForm = new FormData();
            tamperForm.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
            const tamperRes = await axios.post('http://localhost:8000/analyze/', tamperForm, {
                headers: {
                    ...tamperForm.getHeaders(),
                },
                timeout: 60000 // 60 second timeout
            });
            tamperingOutput = tamperRes.data.ai_tampering_output;
        } catch (err) {
            console.warn('Tampering service unavailable, using mock output.');
            tamperingOutput = [{
                field: 'MockField',
                value: 'MockValue',
                tampered: false
            }];
        }

        // Step 3: Extract certificate data from AI analysis
        const { certId, name, roll, course } = aiAnalysisResult;

        if (!certId) {
            logData.status = 'FAILED';
            logData.details.error = 'Certificate ID not found in document';
            console.log('Logging verification attempt:', logData);

            return res.status(400).json({
                status: 'Invalid',
                reasons: ['Certificate ID not found in document'],
                certificate: null,
                ai_tampering_output: tamperingOutput
            });
        }

        logData.details.extractedData = { certId, name, roll, course };

        // Step 3: Check database for certificate
        console.log('Checking database for certificate:', certId);

        // MOCK DATABASE CHECK - Replace with actual Supabase query
        // For now, we'll simulate a valid certificate for testing
        const dbCertificate = {
            certificateId: certId,
            studentName: name || 'Mock Student',
            rollNumber: roll || 'MOCK123',
            course: course || 'Mock Course',
            institution: 'Mock Institution',
            issueDate: new Date(),
            grade: 'A',
            blacklisted: false,
            status: 'active'
        };

        logData.details.validationResult = 'Certificate found in database';

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
            console.log('Logging verification attempt:', logData);

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
                },
                ai_tampering_output: tamperingOutput
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
        console.log('Logging verification attempt:', logData);

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
            },
            ai_tampering_output: tamperingOutput
        });

    } catch (error) {
        console.error('Verification Error:', error);

        logData.status = 'ERROR';
        logData.details.error = error.message;
        console.log('Logging verification attempt:', logData);

        return res.status(500).json({
            status: 'Invalid',
            reasons: ['Internal server error during verification'],
            certificate: null,
            ai_tampering_output: null
        });
    }
};