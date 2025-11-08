const mysql = require('mysql2/promise');
require('dotenv').config();

function parseJdbcMysqlUri(uri) {
  // Example: jdbc:mysql://127.0.0.1:3306/?user=root
  try {
    const withoutPrefix = uri.replace(/^jdbc:/, '');
    const u = new URL(withoutPrefix);
    return {
      host: u.hostname || '127.0.0.1',
      port: Number(u.port) || 3306,
      user: u.searchParams.get('user') || process.env.DB_USER || 'root',
      password: u.searchParams.get('password') || process.env.DB_PASSWORD || '',
      database: u.pathname && u.pathname !== '/' ? u.pathname.replace(/^\//, '') : (process.env.DB_NAME || 'vms'),
    };
  } catch (_) {
    return {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vms',
    };
  }
}

const jdbc = process.env.MYSQL_URI || process.env.DATABASE_URL || 'jdbc:mysql://127.0.0.1:3306/?user=root';
const cfg = parseJdbcMysqlUri(jdbc);

// Override with environment variables if they exist
if (process.env.DB_HOST) cfg.host = process.env.DB_HOST;
if (process.env.DB_PORT) cfg.port = Number(process.env.DB_PORT);
if (process.env.DB_USER) cfg.user = process.env.DB_USER;
if (process.env.DB_PASSWORD !== undefined) cfg.password = process.env.DB_PASSWORD;
if (process.env.DB_NAME) cfg.database = process.env.DB_NAME;

const poolConfig = {
  host: cfg.host,
  port: cfg.port,
  user: cfg.user,
  database: cfg.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Only add password if it's not empty
if (cfg.password && cfg.password.trim() !== '') {
  poolConfig.password = cfg.password;
}

const pool = mysql.createPool(poolConfig);

async function ensureSchema() {
  const connectionConfig = {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    multipleStatements: true,
  };
  
  // Only add password if it's not empty
  if (cfg.password && cfg.password.trim() !== '') {
    connectionConfig.password = cfg.password;
  }
  
  const connection = await mysql.createConnection(connectionConfig);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.database}\``);
    await connection.changeUser({ database: cfg.database });
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        role ENUM('Super Admin','Admin','Security','Receptionist') NOT NULL DEFAULT 'Admin',
        department VARCHAR(100) NOT NULL,
        permissions JSON NULL,
        isActive TINYINT(1) NOT NULL DEFAULT 1,
        lastLogin DATETIME NULL,
        loginAttempts INT NOT NULL DEFAULT 0,
        lockUntil DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        company VARCHAR(255) NULL,
        purpose VARCHAR(255) NOT NULL,
        expectedDuration INT NOT NULL DEFAULT 60,
        checkInTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checkOutTime DATETIME NULL,
        status ENUM('Checked In','Checked Out','Expired') NOT NULL DEFAULT 'Checked In',
        badgeId VARCHAR(64) NOT NULL UNIQUE,
        qrCode TEXT NULL,
        photo TEXT NULL,
        aadhaarId VARCHAR(32) NULL,
        panId VARCHAR(16) NULL,
        passportId VARCHAR(16) NULL,
        drivingLicenseId VARCHAR(32) NULL,
        temperature DECIMAL(5,2) NULL,
        healthDeclaration TINYINT(1) NOT NULL DEFAULT 0,
        notes TEXT NULL,
        location VARCHAR(100) NOT NULL DEFAULT 'Main Lobby',
        isVip TINYINT(1) NOT NULL DEFAULT 0,
        securityLevel ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_checkInTime (checkInTime),
        INDEX idx_status (status)
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('Departmental','Visitor') NOT NULL,
        location VARCHAR(255) NULL,
        notes TEXT NULL,
        status ENUM('Active','Resolved','Cancelled') NOT NULL DEFAULT 'Active',
        incidentCode VARCHAR(64) NOT NULL UNIQUE,
        departmentName VARCHAR(255) NULL,
        groupName VARCHAR(255) NULL,
        pocName VARCHAR(255) NULL,
        pocPhone VARCHAR(20) NULL,
        representativeIdDocument VARCHAR(64) NULL,
        representativeIdNumber VARCHAR(128) NULL,
        headcount INT NULL,
        visitorFirstName VARCHAR(100) NULL,
        visitorLastName VARCHAR(100) NULL,
        visitorPhone VARCHAR(20) NULL,
        reason VARCHAR(255) NULL,
        isMinor TINYINT(1) NOT NULL DEFAULT 0,
        guardianContact VARCHAR(255) NULL,
        createdBy INT NULL,
        resolvedBy INT NULL,
        resolvedAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type_status_createdAt (type, status, createdAt),
        INDEX idx_location_createdAt (location, createdAt)
      );
    `);
  } finally {
    await connection.end();
  }
}

module.exports = { pool, ensureSchema };


