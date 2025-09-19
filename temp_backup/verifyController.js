const axios = require('axios');
const crypto = require('crypto');
const { Certificate, Log, Blacklist } = require('../models');
const blockchainClient = require('../utils/blockchainClient');

/**
 * Verify Certificate Controller
 * Handles file upload, AI analysis, database validation, and blockchain verification
 */
const verifyController = {
    verifyCertificate: async (req, res) => {
        const startTime = Date.now();
        let logData = {
            userId: req.user ? req.user.id : null,
            certId: null,
            ocrData: null,
            result: null,
            reasons: [],
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };

        try {
            // Check if file was uploaded
            if (!req.file) {
                logData.result = 'invalid';
                logData.reasons = ['No file uploaded'];
                await Log.create(logData);

                return res.status(400).json({
                    status: 'Invalid',
                    reasons: ['No file uploaded'],
                    certificate: null
                });
            }

            // Step 1: Send file to AI service for OCR analysis
            console.log('Sending file to AI service for analysis...');

            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            let aiAnalysisResult;
            try {
                const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/analyze`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 30000 // 30 second timeout
                });

                aiAnalysisResult = aiResponse.data;
                logData.ocrData = aiAnalysisResult;
                console.log('AI Analysis Result:', aiAnalysisResult);
            } catch (aiError) {
                console.error('AI Service Error:', aiError.message);
                logData.result = 'invalid';
                logData.reasons = ['AI service unavailable'];
                await Log.create(logData);

                return res.status(503).json({
                    status: 'Invalid',
                    reasons: ['AI service unavailable'],
                    certificate: null
                });
            }

            // Step 2: Extract certificate data from AI analysis
            const { certId, name, roll, course } = aiAnalysisResult;
            logData.certId = certId;

            if (!certId) {
                logData.result = 'invalid';
                logData.reasons = ['Certificate ID not found in document'];
                await Log.create(logData);

                return res.status(400).json({
                    status: 'Invalid',
                    reasons: ['Certificate ID not found in document'],
                    certificate: null
                });
            }

            // Step 3: Check if certificate or institution is blacklisted
            const blacklistEntries = await Blacklist.findAll({
                where: {
                    value: [certId, course] // Check both certId and institution
                }
            });

            if (blacklistEntries.length > 0) {
                logData.result = 'suspicious';
                logData.reasons = ['Certificate or institution is blacklisted'];
                await Log.create(logData);

                return res.status(200).json({
                    status: 'Suspicious',
                    reasons: ['Certificate or institution is blacklisted'],
                    certificate: null
                });
            }

            // Step 4: Check database for certificate
            console.log('Checking database for certificate:', certId);

            const dbCertificate = await Certificate.findOne({
                where: { certId: certId }
            });

            if (!dbCertificate) {
                logData.result = 'invalid';
                logData.reasons = ['Certificate ID not found in database'];
                await Log.create(logData);

                return res.status(404).json({
                    status: 'Invalid',
                    reasons: ['Certificate ID not found in database'],
                    certificate: null
                });
            }

            // Step 5: Validate extracted data against database
            const mismatches = [];

            if (name && dbCertificate.name.toLowerCase() !== name.toLowerCase()) {
                mismatches.push(`Name mismatch: expected "${dbCertificate.name}", found "${name}"`);
            }

            if (roll && dbCertificate.roll !== roll) {
                mismatches.push(`Roll number mismatch: expected "${dbCertificate.roll}", found "${roll}"`);
            }

            if (course && dbCertificate.course.toLowerCase() !== course.toLowerCase()) {
                mismatches.push(`Course mismatch: expected "${dbCertificate.course}", found "${course}"`);
            }

            if (mismatches.length > 0) {
                logData.result = 'suspicious';
                logData.reasons = mismatches;
                await Log.create(logData);

                return res.status(200).json({
                    status: 'Suspicious',
                    reasons: mismatches,
                    certificate: {
                        certId: dbCertificate.certId,
                        name: dbCertificate.name,
                        roll: dbCertificate.roll,
                        course: dbCertificate.course,
                        institution: dbCertificate.institution
                    }
                });
            }

            // Step 6: Compute hash and verify with blockchain
            console.log('Verifying certificate hash with blockchain...');

            const certificateData = {
                certId: dbCertificate.certId,
                name: dbCertificate.name,
                roll: dbCertificate.roll,
                course: dbCertificate.course,
                institution: dbCertificate.institution
            };

            const computedHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(certificateData))
                .digest('hex');

            let blockchainVerification = null;
            try {
                const blockchainResult = await blockchainClient.verifyHash(certId, computedHash);
                if (blockchainResult.success) {
                    blockchainVerification = blockchainResult.isValid;
                } else {
                    console.warn('Blockchain verification failed:', blockchainResult.error);
                }
            } catch (blockchainError) {
                console.error('Blockchain Service Error:', blockchainError.message);
            }

            // Step 7: Determine final status
            let finalStatus = 'Valid';
            let reasons = [];

            if (blockchainVerification === false) {
                finalStatus = 'Suspicious';
                reasons.push('Blockchain hash verification failed');
            } else if (blockchainVerification === null) {
                reasons.push('Blockchain verification unavailable - certificate appears valid in database');
            }

            if (dbCertificate.blacklisted) {
                finalStatus = 'Suspicious';
                reasons.push('Certificate is marked as blacklisted');
            }

            // Step 8: Log the verification result
            logData.result = finalStatus.toLowerCase();
            logData.reasons = reasons;
            await Log.create(logData);

            // Step 9: Return verification result
            const processingTime = Date.now() - startTime;

            return res.status(200).json({
                status: finalStatus,
                reasons: reasons.length > 0 ? reasons : undefined,
                certificate: {
                    certId: dbCertificate.certId,
                    name: dbCertificate.name,
                    roll: dbCertificate.roll,
                    course: dbCertificate.course,
                    institution: dbCertificate.institution,
                    verifiedAt: new Date().toISOString(),
                    blockchainVerified: blockchainVerification,
                    processingTime: `${processingTime}ms`
                }
            });

        } catch (error) {
            console.error('Verification Error:', error);

            logData.result = 'invalid';
            logData.reasons = ['Internal server error during verification'];
            await Log.create(logData);

            return res.status(500).json({
                status: 'Invalid',
                reasons: ['Internal server error during verification'],
                certificate: null
            });
        }
    }
};

module.exports = verifyController;