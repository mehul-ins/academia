const Joi = require('joi');
const validator = require('validator');

/**
 * Request validation middleware
 * Validates and sanitizes incoming request data
 */
const validation = {
    // Email validation schema
    emailSchema: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),

    // Password validation schema
    passwordSchema: Joi.string().min(6).max(128).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
    }),

    // Certificate ID validation schema
    certIdSchema: Joi.string().alphanum().min(3).max(50).required().messages({
        'string.alphanum': 'Certificate ID must contain only letters and numbers',
        'string.min': 'Certificate ID must be at least 3 characters long',
        'string.max': 'Certificate ID cannot exceed 50 characters',
        'any.required': 'Certificate ID is required'
    }),

    // Name validation schema
    nameSchema: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s.'-]+$/).required().messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'string.pattern.base': 'Name can only contain letters, spaces, dots, hyphens, and apostrophes',
        'any.required': 'Name is required'
    }),

    // Institution validation schema
    institutionSchema: Joi.string().min(2).max(200).required().messages({
        'string.min': 'Institution name must be at least 2 characters long',
        'string.max': 'Institution name cannot exceed 200 characters',
        'any.required': 'Institution name is required'
    }),

    // Pagination validation
    paginationSchema: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }),

    // Search validation
    searchSchema: Joi.string().max(100).allow('').optional(),

    // Date validation
    dateSchema: Joi.date().iso().optional(),

    /**
     * Sanitize string input
     */
    sanitizeString: (input) => {
        if (typeof input !== 'string') return input;

        // Remove HTML tags and escape special characters
        let sanitized = validator.escape(input.trim());

        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ');

        return sanitized;
    },

    /**
     * Validate request body against schema
     */
    validateBody: (schema) => {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.body, {
                stripUnknown: true,
                abortEarly: false
            });

            if (error) {
                const errorMessages = error.details.map(detail => detail.message);
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: errorMessages
                });
            }

            // Sanitize string values
            const sanitizedValue = {};
            Object.keys(value).forEach(key => {
                if (typeof value[key] === 'string') {
                    sanitizedValue[key] = validation.sanitizeString(value[key]);
                } else {
                    sanitizedValue[key] = value[key];
                }
            });

            req.body = sanitizedValue;
            next();
        };
    },

    /**
     * Validate query parameters against schema
     */
    validateQuery: (schema) => {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.query, {
                stripUnknown: true,
                abortEarly: false
            });

            if (error) {
                const errorMessages = error.details.map(detail => detail.message);
                return res.status(400).json({
                    status: 'error',
                    message: 'Query validation failed',
                    errors: errorMessages
                });
            }

            req.query = value;
            next();
        };
    },

    /**
     * Validate route parameters
     */
    validateParams: (schema) => {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.params);

            if (error) {
                const errorMessages = error.details.map(detail => detail.message);
                return res.status(400).json({
                    status: 'error',
                    message: 'Parameter validation failed',
                    errors: errorMessages
                });
            }

            req.params = value;
            next();
        };
    },

    /**
     * IP address validation
     */
    validateIP: (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

        if (ip && !validator.isIP(ip)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid IP address format'
            });
        }

        next();
    },

    /**
     * File upload validation
     */
    validateFileUpload: (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
        return (req, res, next) => {
            if (!req.file) {
                return next();
            }

            // Check file type
            if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    status: 'error',
                    message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
                });
            }

            // Check file size
            if (req.file.size > maxSize) {
                return res.status(400).json({
                    status: 'error',
                    message: `File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`
                });
            }

            // Check for potential malicious content
            if (req.file.originalname.includes('..') || req.file.originalname.includes('/')) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid file name'
                });
            }

            next();
        };
    }
};

// Common validation schemas
validation.schemas = {
    // Authentication schemas
    login: Joi.object({
        email: validation.emailSchema,
        password: validation.passwordSchema
    }),

    register: Joi.object({
        email: validation.emailSchema,
        password: validation.passwordSchema,
        role: Joi.string().valid('admin', 'institution').default('institution')
    }),

    // Certificate schemas
    certificate: Joi.object({
        certId: validation.certIdSchema,
        name: validation.nameSchema,
        roll: Joi.string().alphanum().min(3).max(50).required(),
        course: Joi.string().min(2).max(100).required(),
        institution: validation.institutionSchema
    }),

    // Blacklist schemas
    blacklist: Joi.object({
        type: Joi.string().valid('certificate', 'institution').required(),
        value: Joi.string().min(1).max(200).required(),
        reason: Joi.string().max(500).optional()
    }),

    // Query schemas
    pagination: validation.paginationSchema,

    search: Joi.object({
        search: validation.searchSchema,
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }),

    logQuery: Joi.object({
        status: Joi.string().valid('valid', 'invalid', 'suspicious').optional(),
        search: validation.searchSchema,
        startDate: validation.dateSchema,
        endDate: validation.dateSchema,
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }),

    // Parameter schemas
    idParam: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    certIdParam: Joi.object({
        certId: validation.certIdSchema
    }),

    // Profile update schemas
    updateProfile: Joi.object({
        email: validation.emailSchema.optional()
    }),

    changePassword: Joi.object({
        currentPassword: validation.passwordSchema,
        newPassword: validation.passwordSchema
    }).custom((value, helpers) => {
        if (value.currentPassword === value.newPassword) {
            return helpers.error('password.same');
        }
        return value;
    }, 'Password Change Validation').messages({
        'password.same': 'New password must be different from current password'
    })
};

module.exports = validation;