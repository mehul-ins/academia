# Docker Installation Guide

## 📋 Prerequisites

Before running the Academia Platform, you need to install Docker and Docker Compose.

## 🍎 macOS Installation

### Method 1: Docker Desktop (Recommended)

1. **Download Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Click "Download for Mac"
   - Choose the appropriate version for your chip (Intel or Apple Silicon)

2. **Install Docker Desktop**
   ```bash
   # Open the downloaded .dmg file
   # Drag Docker to Applications folder
   # Launch Docker from Applications
   ```

3. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

### Method 2: Homebrew

```bash
# Install Docker
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app

# Verify installation
docker --version
docker-compose --version
```

## 🐧 Linux Installation

### Ubuntu/Debian

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Restart to apply group changes
# Then verify installation
docker --version
docker compose version
```

### CentOS/RHEL

```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

## 🪟 Windows Installation

### Windows 10/11 with WSL2

1. **Install WSL2**
   ```powershell
   # Run as Administrator
   wsl --install
   # Restart computer
   ```

2. **Download Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows
   - Ensure WSL2 backend is enabled during installation

3. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

## 🔧 Post-Installation Setup

### Configure Docker (Optional)

```bash
# Increase memory limit (if needed)
# Edit Docker Desktop settings:
# - Resources > Memory: 4GB or more
# - Resources > CPU: 2 cores or more

# Test Docker installation
docker run hello-world

# Test Docker Compose
docker-compose --version
```

### Start Academia Platform

Once Docker is installed, you can start the platform:

```bash
# Navigate to project directory
cd /path/to/academia

# Quick setup (creates .env and starts services)
./scripts/setup.sh

# Or manually start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🚨 Troubleshooting

### Common Issues

1. **Docker daemon not running**
   ```bash
   # Start Docker Desktop (macOS/Windows)
   # Or start daemon (Linux)
   sudo systemctl start docker
   ```

2. **Permission denied (Linux)**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Port conflicts**
   ```bash
   # Check what's using ports
   lsof -i :80
   lsof -i :3001
   lsof -i :5000
   lsof -i :8545
   
   # Stop conflicting services
   sudo lsof -ti:80 | xargs kill -9
   ```

4. **WSL2 issues (Windows)**
   ```bash
   # Update WSL2
   wsl --update
   
   # Restart WSL2
   wsl --shutdown
   wsl
   ```

## ✅ Verification

After installation, verify everything works:

```bash
# Check Docker
docker --version
docker run hello-world

# Check Docker Compose
docker-compose --version

# Start Academia Platform
cd academia
docker-compose up -d

# Check services
docker-compose ps
curl http://localhost  # Should show frontend
```

## 📚 Next Steps

After Docker installation:

1. Read the main [README.md](./README.md)
2. Run `./scripts/setup.sh` for quick start
3. Access the platform at http://localhost
4. Check the troubleshooting section for common issues

## 🆘 Getting Help

If you encounter issues:

1. Check Docker Desktop logs
2. Run `docker-compose logs` to see service logs
3. Ensure all ports (80, 3001, 5000, 8545, 5432, 6379) are available
4. Try restarting Docker Desktop
5. Check the main README.md troubleshooting section