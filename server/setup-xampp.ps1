# PowerShell script to set environment variables for XAMPP MySQL
Write-Host "Setting up environment variables for XAMPP MySQL..." -ForegroundColor Green

$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = ""
$env:DB_NAME = "vms"
$env:JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"
$env:PORT = "5000"
$env:NODE_ENV = "development"

Write-Host "Environment variables set for XAMPP MySQL" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
npm start
