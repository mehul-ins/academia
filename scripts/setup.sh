#!/bin/bash

# Quick setup script for Academia Platform
echo "🚀 Setting up Academia Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Academia Platform Environment Variables
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@database:5432/academia
REDIS_URL=redis://redis:6379
BLOCKCHAIN_RPC_URL=http://blockchain:8545
JWT_SECRET=your-super-secret-jwt-key-change-this
VITE_API_URL=http://localhost:3001
VITE_AI_API_URL=http://localhost:5000
VITE_BLOCKCHAIN_RPC_URL=http://localhost:8545
EOF
    echo "✅ Created .env file"
fi

# Start the platform
echo "🐳 Starting Academia Platform with Docker Compose..."
docker-compose up -d

echo ""
echo "🎉 Academia Platform is starting up!"
echo ""
echo "📊 Services will be available at:"
echo "   Frontend:    http://localhost"
echo "   Backend API: http://localhost:3001"
echo "   AI Service:  http://localhost:5000"
echo "   Blockchain:  http://localhost:8545"
echo ""
echo "📋 Useful commands:"
echo "   View logs:   docker-compose logs -f"
echo "   Stop:        docker-compose down"
echo "   Restart:     docker-compose restart"
echo ""
echo "⏰ Please wait a few moments for all services to initialize..."