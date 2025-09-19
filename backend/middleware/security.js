const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Security middleware collection
 * Provides various security measures for the application
 */
const security = {
    /**
     * General rate limiting middleware
     */
    generalRateLimit: rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
            status: 'error',
            message: 'Too many requests from this IP. Please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path === '/health' || req.path === '/api/health';
        }
    }),

    /**
     * Strict rate limiting for authentication endpoints
     */
    authRateLimit: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 auth requests per windowMs
        message: {
            status: 'error',
            message: 'Too many authentication attempts. Please try again in 15 minutes.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true // Don't count successful requests
    }),

    /**
     * Rate limiting for verification endpoints
     */
    verifyRateLimit: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.VERIFY_RATE_LIMIT_MAX) || 10,
        message: {
            status: 'error',
            message: 'Too many verification requests. Please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),

    /**
     * Rate limiting for admin operations
     */
    adminRateLimit: rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50, // Higher limit for admin operations
        message: {
            status: 'error',
            message: 'Too many admin requests. Please slow down.'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),

    /**
     * Helmet security headers
     */
    helmetConfig: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false, // Allow file uploads
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }),

    /**
     * NoSQL injection sanitization
     */
    mongoSanitize: mongoSanitize({
        replaceWith: '_'
    }),

    /**
     * XSS protection middleware
     */
    xssProtection: (req, res, next) => {
        // Sanitize request body
        if (req.body) {
            req.body = security.sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
            req.query = security.sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
            req.params = security.sanitizeObject(req.params);
        }

        next();
    },

    /**
     * Sanitize object recursively
     */
    sanitizeObject: (obj) => {
        if (typeof obj === 'string') {
            return xss(obj, {
                whiteList: {}, // No HTML tags allowed
                stripIgnoreTag: true,
                stripIgnoreTagBody: ['script']
            });
        }

        if (Array.isArray(obj)) {
            return obj.map(item => security.sanitizeObject(item));
        }

        if (obj !== null && typeof obj === 'object') {
            const sanitized = {};
            Object.keys(obj).forEach(key => {
                const sanitizedKey = xss(key);
                sanitized[sanitizedKey] = security.sanitizeObject(obj[key]);
            });
            return sanitized;
        }

        return obj;
    },

    /**
     * Request size limiting middleware
     */
    requestSizeLimit: (req, res, next) => {
        const maxSize = parseInt(process.env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024; // 10MB default

        if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
            return res.status(413).json({
                status: 'error',
                message: 'Request entity too large'
            });
        }

        next();
    },

    /**
     * IP whitelist middleware (for admin operations)
     */
    ipWhitelist: (allowedIPs = []) => {
        return (req, res, next) => {
            if (allowedIPs.length === 0) {
                return next(); // No IP restriction if list is empty
            }

            const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

            if (!allowedIPs.includes(clientIP)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied from this IP address'
                });
            }

            next();
        };
    },

    /**
     * User-Agent validation middleware
     */
    validateUserAgent: (req, res, next) => {
        const userAgent = req.get('User-Agent');

        if (!userAgent || userAgent.length > 500) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or missing User-Agent header'
            });
        }

        // Check for suspicious User-Agent patterns
        const suspiciousPatterns = [
            /bot/i,
            /crawl/i,
            /spider/i,
            /scraper/i,
            /sqlmap/i,
            /nikto/i,
            /scan/i
        ];

        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

        if (isSuspicious && !req.path.includes('/health')) {
            console.warn(`Suspicious User-Agent detected: ${userAgent} from IP: ${req.ip}`);

            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        next();
    },

    /**
     * Request logging middleware for security monitoring
     */
    securityLogger: (req, res, next) => {
        const startTime = Date.now();

        // Log suspicious activity
        const logRequest = () => {
            const duration = Date.now() - startTime;
            const logData = {
                timestamp: new Date().toISOString(),
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                contentLength: req.get('Content-Length') || 0
            };

            // Log failed authentication attempts
            if (req.path.includes('/auth/') && res.statusCode === 401) {
                console.warn('Failed auth attempt:', logData);
            }

            // Log admin access
            if (req.path.includes('/admin/')) {
                console.info('Admin access:', logData);
            }

            // Log rate limit violations
            if (res.statusCode === 429) {
                console.warn('Rate limit exceeded:', logData);
            }

            // Log server errors
            if (res.statusCode >= 500) {
                console.error('Server error:', logData);
            }
        };

        res.on('finish', logRequest);
        next();
    },

    /**
     * Security headers middleware
     */
    securityHeaders: (req, res, next) => {
        // Remove sensitive information from response headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');

        // Add custom security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        next();
    },

    /**
     * CORS security middleware
     */
    corsOptions: {
        origin: (origin, callback) => {
            const allowedOrigins = process.env.ALLOWED_ORIGINS ?
                process.env.ALLOWED_ORIGINS.split(',') :
                ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

            // Allow requests with no origin (like mobile apps or Postman)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        optionsSuccessStatus: 200,
        maxAge: 86400 // Cache preflight response for 24 hours
    }
};

module.exports = security;