@echo off
echo Setting up environment variables for XAMPP MySQL...

set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=vms
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
set PORT=5000
set NODE_ENV=development

echo Environment variables set for XAMPP MySQL
echo.
echo Starting server...
npm start
