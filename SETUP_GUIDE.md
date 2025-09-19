# Academia Certificate Verification System - Setup Guide
## Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/mehul-ins/academia.git
cd academia
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `backend` folder:
```env
PORT=5002
POSTGRES_DB=academia
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
JWT_SECRET=your_jwt_secret_here

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5000

# Blockchain Service Configuration  
BLOCKCHAIN_SERVICE_URL=http://localhost:8080
RPC_URL=https://mainnet.infura.io/v3/your-project-id
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=your_contract_address
```

#### Setup PostgreSQL Database
1. Create the database:
```bash
psql -U postgres -h localhost -c "CREATE DATABASE academia;"
```

2. Seed the admin user:
```bash
node scripts/seedAdmin.js
```

#### Start Backend Server
```bash
npm run dev
```
Backend will run on http://localhost:5002

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5002
VITE_APP_TITLE=Academia Certificate Validator
VITE_BACKEND_PORT=5002
```

#### Start Frontend Server
```bash
npm run dev
```
Frontend will run on http://localhost:5173

### 4. Default Login Credentials
- **Email**: `admin@academia.com`
- **Password**: `admin123`

### 5. Common Issues & Solutions

#### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if `academia` database exists

#### Port Conflicts
- Backend default: port 5002
- Frontend default: port 5173
- Change ports in `.env` files if needed

#### CORS Errors
- Ensure backend is running on correct port
- Check `VITE_API_URL` in frontend `.env`

#### 500 Server Errors
- Check backend console for detailed error messages
- Verify all environment variables are set
- Ensure database tables are created (run seedAdmin.js)

### 6. Testing the System

1. **Login**: Use admin credentials at http://localhost:5173
2. **Certificate Verification**: Upload a certificate file or enter a certificate ID
3. **Admin Dashboard**: Access admin features after login
4. **Institute Registration**: Register new institutes (when not logged in)

### 7. Development Notes

- Backend uses PostgreSQL with Sequelize ORM
- Frontend uses React with Vite
- Authentication via JWT tokens
- CORS is configured for development (allows all origins)

### 8. Troubleshooting

If you encounter issues:
1. Check both backend and frontend console logs
2. Verify all dependencies are installed (`npm install`)
3. Ensure PostgreSQL service is running
4. Confirm environment variables match your local setup
5. Try clearing browser cache and localStorage

For additional help, check the error messages in the terminal and browser console.