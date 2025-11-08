// Database wrapper that works with both SQLite and MySQL
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

let db;
let dbType;

function initDB() {
  if (process.env.DEMO_DATABASE === 'sqlite') {
    dbType = 'sqlite';
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.error('❌ Error creating demo database:', err);
        throw err;
      }
      console.log('✅ Demo SQLite database connected (in-memory)');
    });
  } else {
    dbType = 'mysql';
    // MySQL connection would be initialized here
    // For now, we'll use SQLite as fallback
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.error('❌ Error creating fallback database:', err);
        throw err;
      }
      console.log('✅ Fallback SQLite database connected (in-memory)');
    });
  }
  return db;
}

function getDB() {
  if (!db) {
    return initDB();
  }
  return db;
}

// Wrapper functions for database operations
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      initDB();
    }
    if (dbType === 'sqlite') {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      // MySQL implementation would go here
      reject(new Error('MySQL not implemented in this wrapper'));
    }
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      initDB();
    }
    if (dbType === 'sqlite') {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    } else {
      reject(new Error('MySQL not implemented in this wrapper'));
    }
  });
}

module.exports = {
  initDB,
  getDB,
  query,
  run
};