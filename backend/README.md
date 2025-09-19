# Academia Certificate Verification Backend

A robust Node.js + Express backend system for certificate verification with blockchain integration, AI-powered analysis, and comprehensive admin management.

## 🚀 Features

- **JWT Authentication** with role-based access control (admin/institution)
- **Certificate Verification** with AI-powered analysis and blockchain validation
- **Blockchain Integration** using ethers.js for certificate hash storage
- **File Upload** support for PDF/image certificates with multer
- **Admin Dashboard** with comprehensive analytics and management
- **Database ORM** using Sequelize with PostgreSQL/SQLite support
- **Rate Limiting** and security middleware
- **Comprehensive Health Checks** for all system components
- **Blacklist Management** for institutions and certificates
- **Bulk Certificate Upload** via CSV for institutions

## 📁 Project Structure

```
backend/
├── controllers/           # Request handlers
│   ├── authController.js     # Authentication logic
│   ├── verifyController.js   # Certificate verification
│   ├── certificateController.js # Certificate management
│   └── adminController.js    # Admin operations
├── middleware/           # Custom middleware
│   ├── auth.js              # JWT authentication
│   └── upload.js            # File upload handling
├── models/              # Database models
│   ├── index.js             # Database configuration
│   ├── User.js              # User model
│   ├── Certificate.js       # Certificate model
│   ├── Log.js               # Verification logs
│   └── Blacklist.js         # Blacklist entries
├── routes/              # API routes
│   ├── auth.js              # Authentication endpoints
│   ├── verify.js            # Verification endpoints
│   ├── certificates.js      # Certificate management
│   └── admin.js             # Admin endpoints
├── scripts/             # Database scripts
│   └── initDb.js            # Database initialization
├── utils/               # Utility functions
│   ├── blockchainClient.js  # Blockchain interaction
│   └── healthcheck.js       # Health monitoring
├── uploads/             # File upload directory
├── app.js               # Express app configuration
├── server.js            # Server startup
└── package.json         # Dependencies
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16+)
- PostgreSQL (recommended) or SQLite
- Ethereum RPC endpoint (for blockchain features)
- AI Service endpoint (for certificate analysis)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/academia
# Or for SQLite:
# DATABASE_URL=sqlite:./database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server Configuration
PORT=5002
NODE_ENV=development

# Blockchain Configuration (Optional)
BLOCKCHAIN_RPC_URL=https://your-ethereum-rpc-url
BLOCKCHAIN_PRIVATE_KEY=your-private-key
BLOCKCHAIN_CONTRACT_ADDRESS=your-contract-address

# AI Service Configuration (Optional)
AI_SERVICE_URL=http://localhost:8000

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

### 3. Database Setup

Initialize the database with default admin user:

```bash
npm run init-db
```

This creates:
- All required database tables
- Default admin user: `admin@academia.com` / `admin123`
- Sample data for testing

⚠️ **Important**: Change the default admin password after first login!

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📊 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile (requires auth)

### Certificate Verification (`/api/verify`)

- `POST /certificate` - Verify certificate (file upload)
- `POST /hash` - Verify certificate by hash

### Certificate Management (`/api/certificates`)

- `GET /` - List certificates (auth required)
- `POST /bulk-upload` - Bulk upload via CSV (institution role)
- `GET /:id` - Get specific certificate
- `PUT /:id` - Update certificate
- `DELETE /:id` - Delete certificate

### Admin Operations (`/api/admin`)

- `GET /stats` - Dashboard statistics
- `GET /logs` - Verification logs with filtering
- `GET /blacklist` - Blacklist management
- `POST /blacklist` - Add to blacklist
- `DELETE /blacklist/:id` - Remove from blacklist
- `GET /users` - User management
- `DELETE /users/:id` - Delete user

### Health Monitoring

- `GET /health` - Comprehensive health check
- `GET /api/health` - Simple health check

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **Role-based Access Control** (admin/institution)
- **Rate Limiting** (100 requests per 15 minutes per IP)
- **Enhanced Authentication Rate Limiting** (5 login attempts per 15 minutes)
- **Verification Rate Limiting** (10 verification requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Input Validation** using Joi schema validation
- **XSS Protection** with input sanitization
- **NoSQL Injection Protection** via express-mongo-sanitize
- **Security Headers** via Helmet middleware
- **Password Hashing** with bcrypt
- **File Upload Security** with type and size validation
- **SQL Injection Protection** via Sequelize ORM
- **Request Size Limiting** (10MB default)
- **User-Agent Validation** to block suspicious bots
- **Security Logging** for monitoring and audit trails
- **IP Validation** and optional IP whitelisting for admin operations

### Security Middleware Stack

1. **Helmet** - Security headers
2. **Rate Limiting** - Multiple layers (general, auth, verify, admin)
3. **Input Sanitization** - XSS and NoSQL injection protection
4. **Validation** - Comprehensive input validation with Joi
5. **Authentication** - JWT token verification
6. **Authorization** - Role-based access control
7. **Logging** - Security event monitoring

## 🧪 Testing Health Checks

### Quick Health Check
```bash
curl http://localhost:5002/api/health
```

### Comprehensive Health Check
```bash
curl http://localhost:5002/health
```

This checks:
- Database connectivity
- Blockchain service status
- AI service availability
- File system access
- Overall system health

## 🏗️ Database Schema

### Users
- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `role` (admin/institution)
- `createdAt`, `updatedAt`

### Certificates
- `id` (Primary Key)
- `certId` (Unique)
- `name`
- `institution`
- `issueDate`
- `hash`
- `createdAt`, `updatedAt`

### Logs
- `id` (Primary Key)
- `certId`
- `result` (valid/invalid/suspicious)
- `reasons` (JSON array)
- `ipAddress`
- `userId` (Foreign Key)
- `certificateId` (Foreign Key)
- `createdAt`

### Blacklist
- `id` (Primary Key)
- `type` (certificate/institution)
- `value`
- `reason`
- `createdAt`

## 🔧 Configuration

### Database
The system supports both PostgreSQL and SQLite. Configure via `DATABASE_URL` environment variable.

### Blockchain
Optional blockchain integration for certificate hash verification. Requires:
- Ethereum RPC endpoint
- Private key for transactions
- Smart contract address

### AI Service
Optional AI service for certificate analysis. The system gracefully handles AI service unavailability.

## 📈 Monitoring & Logging

- **Request Logging** via Morgan middleware
- **Error Handling** with comprehensive error middleware
- **Health Monitoring** with detailed system checks
- **Verification Logging** for audit trails

## 🚨 Error Handling

The system implements comprehensive error handling:
- Structured error responses
- Database error handling
- File upload error management
- Blockchain interaction error handling
- AI service timeout and error handling

## 🔄 Development

### Hot Reloading
Use `npm run dev` for development with nodemon auto-restart.

### Database Migrations
The system uses Sequelize with `alter: true` for automatic schema updates during development.

### Adding New Features
1. Create controller in `controllers/`
2. Add routes in `routes/`
3. Update models if needed
4. Add validation schemas
5. Update tests and documentation

## 📝 License

This project is part of the SIH 2025 Academia platform.

---

## 🚀 Quick Start Commands

```bash
# Full deployment with all checks
npm run deploy

# Quick setup (skip health checks)
npm run deploy:quick

# Health check only
npm run deploy:health

# Manual setup
npm install
npm run init-db
npm run dev

# Test all API endpoints
npm run test-api

# Check system health
curl http://localhost:5002/health
```

**Default Admin Credentials:**
- Email: `admin@academia.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the default admin password immediately after first login!