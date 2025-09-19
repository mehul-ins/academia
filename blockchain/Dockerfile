# Blockchain Service Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Install development dependencies for compilation
RUN npm install

# Compile smart contracts
RUN npx hardhat compile

# Expose port for Hardhat node
EXPOSE 8545

# Create startup script
RUN echo '#!/bin/sh\nif [ "$NODE_ENV" = "development" ]; then\n  npx hardhat node --hostname 0.0.0.0\nelse\n  npm start\nfi' > start.sh && chmod +x start.sh

# Default command
CMD ["./start.sh"]