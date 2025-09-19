#!/bin/bash

# Test script for Academia Platform
echo "🧪 Running Academia Platform Tests..."

# Test backend
echo "📡 Testing Backend Service..."
docker-compose exec backend npm test || echo "❌ Backend tests failed"

# Test blockchain
echo "⛓️ Testing Blockchain Service..."
docker-compose exec blockchain npm test || echo "❌ Blockchain tests failed"

# Test AI service
echo "🤖 Testing AI Service..."
docker-compose exec ai-service python -m pytest || echo "❌ AI service tests failed"

# Test frontend
echo "🎨 Testing Frontend..."
docker-compose exec frontend npm test || echo "❌ Frontend tests failed"

# Health checks
echo "🏥 Running Health Checks..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

# Check AI service health
if curl -f http://localhost:5002/health > /dev/null 2>&1; then
    echo "✅ AI service health check passed"
else
    echo "❌ AI service health check failed"
fi

# Check blockchain RPC
if curl -f -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null 2>&1; then
    echo "✅ Blockchain RPC check passed"
else
    echo "❌ Blockchain RPC check failed"
fi

echo "🎉 Test run completed!"