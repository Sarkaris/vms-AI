#!/bin/bash

# VMS Deployment Script
# This script handles the complete deployment process
# Usage: ./deploy.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR=$(pwd)
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
LOG_DIR="$PROJECT_DIR/logs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VMS Deployment Script${NC}"
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

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command_exists node; then
    error_exit "Node.js is not installed. Please install Node.js 16+ first."
fi

if ! command_exists npm; then
    error_exit "npm is not installed. Please install npm first."
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    error_exit "Node.js version 16+ is required. Current version: $(node -v)"
fi

success_msg "Node.js $(node -v) found"

# Check if PM2 is installed
if ! command_exists pm2; then
    info_msg "PM2 not found. Installing PM2..."
    npm install -g pm2 || error_exit "Failed to install PM2"
    success_msg "PM2 installed"
else
    success_msg "PM2 found: $(pm2 -v)"
fi

# Check if MySQL is running (if not in demo mode)
if [ ! -f "$SERVER_DIR/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found in server directory${NC}"
    echo -e "${YELLOW}Please create server/.env file from server/.env.example${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create logs directory
mkdir -p "$LOG_DIR"
success_msg "Logs directory ready"

# Install server dependencies
echo -e "\n${YELLOW}Installing server dependencies...${NC}"
cd "$SERVER_DIR"
if [ -d "node_modules" ]; then
    info_msg "Cleaning old node_modules..."
    rm -rf node_modules
fi
npm install --production || error_exit "Failed to install server dependencies"
success_msg "Server dependencies installed"

# Install client dependencies and build
echo -e "\n${YELLOW}Installing client dependencies...${NC}"
cd "$CLIENT_DIR"
if [ -d "node_modules" ]; then
    info_msg "Cleaning old node_modules..."
    rm -rf node_modules
fi
npm install || error_exit "Failed to install client dependencies"
success_msg "Client dependencies installed"

echo -e "\n${YELLOW}Building React application...${NC}"
npm run build || error_exit "Failed to build React application"
success_msg "React application built successfully"

# Verify build exists
if [ ! -d "$CLIENT_DIR/build" ]; then
    error_exit "Build directory not found. Build may have failed."
fi

# Check database connection (if MySQL mode)
cd "$SERVER_DIR"
if grep -q "DEMO_MODE=false" .env 2>/dev/null || [ ! -f .env ]; then
    info_msg "Checking MySQL connection..."
    node -e "
    require('dotenv').config();
    const mysql = require('mysql2/promise');
    (async () => {
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'vms'
            });
            await connection.end();
            console.log('✓ MySQL connection successful');
            process.exit(0);
        } catch (err) {
            console.error('✗ MySQL connection failed:', err.message);
            process.exit(1);
        }
    })();
    " || error_exit "MySQL connection failed. Please check your database configuration."
fi

# Stop existing PM2 process
echo -e "\n${YELLOW}Stopping existing PM2 processes...${NC}"
cd "$PROJECT_DIR"
pm2 stop vms-server 2>/dev/null || true
pm2 delete vms-server 2>/dev/null || true
success_msg "Old processes stopped"

# Start with PM2
echo -e "\n${YELLOW}Starting application with PM2...${NC}"
pm2 start ecosystem.config.js || error_exit "Failed to start application with PM2"
success_msg "Application started with PM2"

# Save PM2 configuration
pm2 save || error_exit "Failed to save PM2 configuration"

# Setup PM2 startup script
info_msg "Setting up PM2 startup script..."
pm2 startup | tail -1 | bash || info_msg "PM2 startup script setup skipped (may require sudo)"

# Show status
echo -e "\n${YELLOW}Application Status:${NC}"
pm2 status

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "Useful commands:"
echo -e "  ${YELLOW}pm2 logs vms-server${NC}     - View logs"
echo -e "  ${YELLOW}pm2 status${NC}            - Check status"
echo -e "  ${YELLOW}pm2 restart vms-server${NC} - Restart application"
echo -e "  ${YELLOW}pm2 stop vms-server${NC}   - Stop application"
echo -e "\n"

cd "$PROJECT_DIR"

