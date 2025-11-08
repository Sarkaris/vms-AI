#!/bin/bash

# VMS Demo Startup Script
# This script starts the Visitor Management System in demo mode

echo "🚀 Starting VMS Visitor Management System..."

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the server directory"
    exit 1
fi

# Copy demo environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📋 Setting up demo environment..."
    cp .env.demo .env
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi

# Check if client directory exists and install dependencies
if [ -d "../client" ] && [ ! -d "../client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd ../client
    npm install
    cd ../server
fi

# Start the server
echo "🎯 Starting server in demo mode..."
echo "💡 Demo mode provides read-only access to showcase all features"
echo "🔗 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API will be available at: http://localhost:5000"
echo "📊 Health check: http://localhost:5000/api/health"
echo "🔍 Demo status: http://localhost:5000/api/demo-status"
echo ""

npm run dev