# Academia Platform

A comprehensive blockchain-based academia platform with AI integration, featuring smart contracts, backend services, and a modern React frontend.

## 🏗️ Architecture

```
academia/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js/Express API server
├── blockchain/        # Hardhat smart contracts
├── ai-service/        # Python AI microservice
└── docker-compose.yml # Multi-service orchestration
```

## 🚀 Quick Start with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- Git

### Production Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd academia
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5002
   - AI Service: http://localhost:5000
   - Blockchain RPC: http://localhost:8545
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

4. **Stop all services**
   ```bash
   docker-compose down
   ```

### Development Setup

1. **Start development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access services with hot reload**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5002
   - AI Service: http://localhost:5000
   - Blockchain: http://localhost:8545

3. **View logs**
   ```bash
   # All services
   docker-compose -f docker-compose.dev.yml logs -f
   
   # Specific service
   docker-compose -f docker-compose.dev.yml logs -f frontend
   ```

## 🛠️ Manual Development Setup

If you prefer to run services individually for development:

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### 1. Blockchain Service

```bash
cd blockchain

# Install dependencies
npm install

# Start local blockchain
npm run node
# or
npx hardhat node

# Compile contracts
npm run compile

# Run tests
npm test
```

### 2. Backend Service

```bash
cd backend

# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/academia"
export REDIS_URL="redis://localhost:6379"
export BLOCKCHAIN_RPC_URL="http://localhost:8545"

# Start development server
npm run dev
```

### 3. AI Service

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_ENV=development
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/academia"

# Start service
python app.py
```

### 4. Frontend Service

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
export VITE_API_URL="http://localhost:5002"
export VITE_AI_API_URL="http://localhost:5000"

# Start development server
npm run dev
```

## 🐳 Docker Commands Reference

### Basic Operations

```bash
# Build all services
docker-compose build

# Start services in background
docker-compose up -d

# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Rebuild a specific service
docker-compose build backend

# Execute commands in running container
docker-compose exec backend npm run test
docker-compose exec blockchain npx hardhat compile

# Access container shell
docker-compose exec backend sh
docker-compose exec ai-service bash
```

### Debugging

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Follow logs in real-time
docker-compose logs -f --tail=100 frontend

# Inspect container
docker-compose exec backend ps aux
docker-compose exec backend ls -la
```

## 🌍 Environment Variables

### Backend Service
```env
NODE_ENV=development|production
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
BLOCKCHAIN_RPC_URL=http://blockchain:8545
JWT_SECRET=your-jwt-secret
```

### AI Service
```env
FLASK_ENV=development|production
DATABASE_URL=postgresql://user:pass@host:port/db
AI_MODEL_PATH=/path/to/model
API_KEY=your-api-key
```

### Frontend Service
```env
VITE_API_URL=http://localhost:5002
VITE_AI_API_URL=http://localhost:5000
VITE_BLOCKCHAIN_RPC_URL=http://localhost:8545
```

## 📊 Service Details

### Frontend (React + Vite)
- **Port**: 80 (production), 3000 (development)
- **Technology**: React 19, Vite, React Router
- **Features**: Hot reload, optimized builds, nginx reverse proxy

### Backend (Node.js + Express)
- **Port**: 5002
- **Technology**: Express, PostgreSQL, Redis
- **Features**: API endpoints, database integration, blockchain interaction

### Blockchain (Hardhat)
- **Port**: 8545
- **Technology**: Hardhat, Ethereum, Solidity
- **Features**: Smart contracts, local blockchain, testing framework

### AI Service (Python + Flask)
- **Port**: 5000
- **Technology**: Flask, scikit-learn, transformers
- **Features**: Machine learning models, data processing

### Database (PostgreSQL)
- **Port**: 5432
- **Technology**: PostgreSQL 15
- **Features**: Persistent data storage, ACID compliance

### Cache (Redis)
- **Port**: 6379
- **Technology**: Redis 7
- **Features**: Session storage, caching, pub/sub

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using a port
   lsof -i :3000
   
   # Kill process using port
   kill -9 $(lsof -t -i:3000)
   ```

2. **Docker build failures**
   ```bash
   # Clean build cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs database
   
   # Reset database
   docker-compose down -v
   docker-compose up database
   ```

4. **Node modules issues**
   ```bash
   # Clear node modules in container
   docker-compose exec frontend rm -rf node_modules
   docker-compose exec frontend npm install
   ```

### Health Checks

```bash
# Check service health
curl http://localhost:5002/health
curl http://localhost:5000/health

# Check blockchain connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

## 📈 Performance Optimization

### Production Deployment

1. **Use environment-specific configs**
   ```bash
   cp docker-compose.yml docker-compose.prod.yml
   # Edit production-specific settings
   ```

2. **Enable resource limits**
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

3. **Use production builds**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

## 📝 Development Workflow

1. **Feature Development**
   ```bash
   # Start development environment
   docker-compose -f docker-compose.dev.yml up -d
   
   # Make changes to code (hot reload enabled)
   # Test changes
   
   # Run tests
   docker-compose exec backend npm test
   docker-compose exec blockchain npm test
   ```

2. **Testing**
   ```bash
   # Run all tests
   ./scripts/test-all.sh
   
   # Run specific service tests
   docker-compose exec backend npm test
   ```

3. **Deployment**
   ```bash
   # Build production images
   docker-compose build
   
   # Deploy to production
   docker-compose up -d
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review Docker logs: `docker-compose logs`
- Open an issue on GitHub