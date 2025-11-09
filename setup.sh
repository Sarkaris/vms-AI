#!/bin/bash

# VMS Server Setup Script
# This script sets up the server environment for the first time
# Usage: ./setup.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VMS Server Setup Script${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print error and exit
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

# Function to print success
success_msg() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print info
info_msg() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running as root (for some operations)
if [ "$EUID" -eq 0 ]; then 
    info_msg "Running as root"
fi

# Update system packages
echo -e "${BLUE}Step 1: Updating system packages...${NC}"
if command_exists apt-get; then
    sudo apt-get update -qq
    success_msg "System packages updated"
elif command_exists yum; then
    sudo yum update -y -q
    success_msg "System packages updated"
else
    info_msg "Package manager not detected, skipping system update"
fi

# Install Node.js if not installed
echo -e "\n${BLUE}Step 2: Checking Node.js installation...${NC}"
if ! command_exists node; then
    info_msg "Node.js not found. Installing Node.js 18.x..."
    
    if command_exists apt-get; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists yum; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        error_exit "Please install Node.js 16+ manually from https://nodejs.org"
    fi
    
    success_msg "Node.js installed: $(node -v)"
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        error_exit "Node.js version 16+ is required. Current version: $(node -v)"
    fi
    success_msg "Node.js found: $(node -v)"
fi

# Install npm if not installed
if ! command_exists npm; then
    error_exit "npm is not installed. Please install npm."
fi
success_msg "npm found: $(npm -v)"

# Install PM2 globally
echo -e "\n${BLUE}Step 3: Installing PM2...${NC}"
if ! command_exists pm2; then
    sudo npm install -g pm2 || error_exit "Failed to install PM2"
    success_msg "PM2 installed: $(pm2 -v)"
else
    success_msg "PM2 already installed: $(pm2 -v)"
fi

# Install MySQL if not in demo mode
echo -e "\n${BLUE}Step 4: Database setup...${NC}"
read -p "Do you want to install MySQL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command_exists mysql; then
        info_msg "Installing MySQL..."
        if command_exists apt-get; then
            sudo apt-get install -y mysql-server
        elif command_exists yum; then
            sudo yum install -y mysql-server
        fi
        success_msg "MySQL installed"
        
        info_msg "Starting MySQL service..."
        sudo systemctl start mysql
        sudo systemctl enable mysql
        success_msg "MySQL service started and enabled"
        
        echo -e "${YELLOW}IMPORTANT: Please secure your MySQL installation:${NC}"
        echo -e "${YELLOW}Run: sudo mysql_secure_installation${NC}"
    else
        success_msg "MySQL already installed"
    fi
else
    info_msg "Skipping MySQL installation. You can use demo mode with SQLite."
fi

# Install Nginx
echo -e "\n${BLUE}Step 5: Installing Nginx...${NC}"
read -p "Do you want to install Nginx? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command_exists nginx; then
        info_msg "Installing Nginx..."
        if command_exists apt-get; then
            sudo apt-get install -y nginx
        elif command_exists yum; then
            sudo yum install -y nginx
        fi
        success_msg "Nginx installed"
        
        info_msg "Starting Nginx service..."
        sudo systemctl start nginx
        sudo systemctl enable nginx
        success_msg "Nginx service started and enabled"
        
        echo -e "${YELLOW}Nginx configuration file created: nginx.conf${NC}"
        echo -e "${YELLOW}Copy it to /etc/nginx/sites-available/vms and create symlink${NC}"
    else
        success_msg "Nginx already installed"
    fi
else
    info_msg "Skipping Nginx installation."
fi

# Install Certbot for SSL
echo -e "\n${BLUE}Step 6: SSL Certificate setup...${NC}"
read -p "Do you want to install Certbot for SSL certificates? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command_exists certbot; then
        info_msg "Installing Certbot..."
        if command_exists apt-get; then
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command_exists yum; then
            sudo yum install -y certbot python3-certbot-nginx
        fi
        success_msg "Certbot installed"
        
        echo -e "${YELLOW}To get SSL certificate, run:${NC}"
        echo -e "${YELLOW}sudo certbot --nginx -d yourdomain.com${NC}"
    else
        success_msg "Certbot already installed"
    fi
else
    info_msg "Skipping Certbot installation."
fi

# Create necessary directories
echo -e "\n${BLUE}Step 7: Creating directories...${NC}"
mkdir -p logs
mkdir -p server/logs
success_msg "Directories created"

# Setup firewall (if ufw is available)
echo -e "\n${BLUE}Step 8: Firewall configuration...${NC}"
if command_exists ufw; then
    read -p "Do you want to configure UFW firewall? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info_msg "Configuring firewall..."
        sudo ufw allow 22/tcp  # SSH
        sudo ufw allow 80/tcp   # HTTP
        sudo ufw allow 443/tcp  # HTTPS
        echo -e "${YELLOW}Firewall rules added. Enable with: sudo ufw enable${NC}"
    fi
elif command_exists firewall-cmd; then
    read -p "Do you want to configure firewalld? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info_msg "Configuring firewalld..."
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        success_msg "Firewall configured"
    fi
else
    info_msg "Firewall not detected, skipping"
fi

# Create .env file template
echo -e "\n${BLUE}Step 9: Environment configuration...${NC}"
if [ ! -f "server/.env" ]; then
    info_msg "Creating .env file template..."
    cat > server/.env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000

# Domain Configuration
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=vms_user
DB_PASSWORD=your_secure_password_here
DB_NAME=vms

# JWT Secret (IMPORTANT: Change this!)
JWT_SECRET=$(openssl rand -base64 32)

# Demo Mode
DEMO_MODE=false
DEMO_DATABASE=mysql

# Security
SESSION_SECRET=$(openssl rand -base64 32)
EOF
    success_msg ".env file created at server/.env"
    echo -e "${YELLOW}IMPORTANT: Please edit server/.env and update all configuration values!${NC}"
else
    info_msg ".env file already exists"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "Next steps:"
echo -e "  1. Edit ${YELLOW}server/.env${NC} with your configuration"
echo -e "  2. Create MySQL database and user"
echo -e "  3. Run ${YELLOW}./deploy.sh${NC} to deploy the application"
echo -e "  4. Configure Nginx (copy nginx.conf to /etc/nginx/sites-available/)"
echo -e "  5. Setup SSL certificate with Certbot"
echo -e "\n"

