// Database wrapper with Turso (SQLite Cloud) support for Vercel
const { createClient } = require('@libsql/client');
const sqlite3 = require('sqlite3').verbose();

let db;
let dbType;

function initDB() {
  // Check for Turso (SQLite Cloud)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    dbType = 'turso';
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    console.log('✅ Turso (SQLite Cloud) database connected');
    return db;
  }
  
  // Check for local SQLite (demo mode)
  if (process.env.DEMO_DATABASE === 'sqlite') {
    dbType = 'sqlite';
    const dbPath = process.env.SQLITE_DB_PATH || ':memory:';
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error creating SQLite database:', err);
        throw err;
      }
      console.log(`✅ SQLite database connected: ${dbPath}`);
    });
    return db;
  }
  
  // Fallback to in-memory SQLite
  dbType = 'sqlite';
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('❌ Error creating fallback database:', err);
      throw err;
    }
    console.log('✅ Fallback SQLite database connected (in-memory)');
  });
  return db;
}

function getDB() {
  if (!db) {
    return initDB();
  }
  return db;
}

// Wrapper functions for database operations
async function query(sql, params = []) {
  if (!db) {
    initDB();
  }
  
  if (dbType === 'turso') {
    // Turso uses async/await
    try {
      const result = await db.execute(sql, params);
      return result.rows;
    } catch (err) {
      throw err;
    }
  } else if (dbType === 'sqlite') {
    // SQLite uses callbacks
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

async function run(sql, params = []) {
  if (!db) {
    initDB();
  }
  
  if (dbType === 'turso') {
    // Turso uses async/await
    try {
      const result = await db.execute(sql, params);
      return { 
        lastID: result.lastInsertRowid?.toString() || null, 
        changes: result.rowsAffected || 0 
      };
    } catch (err) {
      throw err;
    }
  } else if (dbType === 'sqlite') {
    // SQLite uses callbacks
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

module.exports = {
  initDB,
  getDB,
  query,
  run
};

