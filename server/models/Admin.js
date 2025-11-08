// SQL-backed Admin Data Access Object providing a mongoose-like API used by routes
const bcrypt = require('bcryptjs');
const { getDB, query, run } = require('../utils/databaseWrapper');

class AdminRecord {
  constructor(row) {
    Object.assign(this, row);
  }
  get _id() {
    return this.id;
  }
  get isLocked() {
    return !!(this.lockUntil && new Date(this.lockUntil) > new Date());
  }
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }
  async incLoginAttempts() {
    const now = new Date();
    let newAttempts = (this.loginAttempts || 0) + 1;
    let lockUntil = this.lockUntil;
    if (newAttempts >= 5 && !this.isLocked) {
      lockUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }
    await run('UPDATE admins SET loginAttempts = ?, lockUntil = ? WHERE username = ?', [newAttempts, lockUntil, this.username]);
  }
  async resetLoginAttempts() {
    await run('UPDATE admins SET loginAttempts = 0, lockUntil = NULL WHERE id = ?', [this.id]);
    this.loginAttempts = 0;
    this.lockUntil = null;
  }
  async save() {
    // Update fields
    const fields = [
      'username','email','password','firstName','lastName','role','department','permissions','isActive','lastLogin','loginAttempts','lockUntil'
    ];
    const values = fields.map((f) => this[f] == null ? null : this[f]);
    await run(
      'UPDATE admins SET username=?, email=?, password=?, firstName=?, lastName=?, role=?, department=?, permissions=?, isActive=?, lastLogin=?, loginAttempts=?, lockUntil=? WHERE id=?',
      [...values, this.id]
    );
    return this;
  }
}

class AdminDAO {
  static async findOne(where) {
    // Supports { email }, or { $or: [{email},{username}] }
    let sql = 'SELECT * FROM admins WHERE ';
    const params = [];
    if (where.$or && Array.isArray(where.$or)) {
      const ors = [];
      for (const cond of where.$or) {
        if (cond.email) { ors.push('email = ?'); params.push(String(cond.email).toLowerCase().trim()); }
        if (cond.username) { ors.push('username = ?'); params.push(String(cond.username)); }
      }
      sql += ors.join(' OR ');
    } else if (where.email) {
      sql += 'email = ?';
      params.push(String(where.email).toLowerCase().trim());
    } else if (where.username) {
      sql += 'username = ?';
      params.push(String(where.username));
    } else if (where.id) {
      sql += 'id = ?';
      params.push(where.id);
    } else {
      sql += '1=0';
    }
    const rows = await query(sql + ' LIMIT 1', params);
    return rows[0] ? new AdminRecord(rows[0]) : null;
  }

  static async findById(id) {
    const rows = await query('SELECT * FROM admins WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? new AdminRecord(rows[0]) : null;
  }

  static async find(where = {}) {
    let sql = 'SELECT id as _id, id, username, email, firstName, lastName, role, department, permissions, isActive, createdAt, updatedAt FROM admins';
    const params = [];
    const conds = [];
    if (where.isActive !== undefined) { conds.push('isActive = ?'); params.push(where.isActive ? 1 : 0); }
    if (where.role) { conds.push('role = ?'); params.push(where.role); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY createdAt DESC';
    const rows = await query(sql, params);
    return rows.map(r => ({ ...r, permissions: r.permissions }));
  }

  static async countDocuments(where = {}) {
    let sql = 'SELECT COUNT(*) as cnt FROM admins';
    const params = [];
    const conds = [];
    if (where.isActive !== undefined) { conds.push('isActive = ?'); params.push(where.isActive ? 1 : 0); }
    if (where.lastLoginSinceStartOfDay) { conds.push('lastLogin >= ?'); params.push(where.lastLoginSinceStartOfDay); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    const rows = await query(sql, params);
    return rows[0].cnt;
  }

  static async aggregateByRole() {
    const rows = await query('SELECT role as _id, COUNT(*) as count FROM admins GROUP BY role');
    return rows.map(r => ({ _id: r._id, count: r.count }));
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    // Fetch current
    const current = await this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...update };
    // Hash password if provided
    if (update.password) {
      const salt = await bcrypt.genSalt(10);
      merged.password = await bcrypt.hash(update.password, salt);
    }
    await run(
      'UPDATE admins SET username=?, email=?, password=?, firstName=?, lastName=?, role=?, department=?, permissions=?, isActive=?, lastLogin=?, loginAttempts=?, lockUntil=? WHERE id=?',
      [merged.username, merged.email, merged.password, merged.firstName, merged.lastName, merged.role, merged.department, JSON.stringify(merged.permissions || null), merged.isActive ? 1 : 0, merged.lastLogin ? new Date(merged.lastLogin) : null, merged.loginAttempts || 0, merged.lockUntil ? new Date(merged.lockUntil) : null, id]
    );
    if (options.select === '-password') {
      delete merged.password;
    }
    return merged;
  }

  constructor(payload) {
    this.payload = payload;
  }
  async save() {
    const p = { ...this.payload };
    if (p.email) p.email = String(p.email).toLowerCase().trim();
    if (!p.permissions) p.permissions = null;
    const salt = await bcrypt.genSalt(10);
    p.password = await bcrypt.hash(p.password, salt);
    const result = await run(
      'INSERT INTO admins (username,email,password,firstName,lastName,role,department,permissions,isActive) VALUES (?,?,?,?,?,?,?,?,1)',
      [p.username,p.email,p.password,p.firstName,p.lastName,p.role,p.department, JSON.stringify(p.permissions)]
    );
    const rows = await query('SELECT * FROM admins WHERE id = ?', [result.lastID]);
    return new AdminRecord(rows[0]);
  }
}

module.exports = AdminDAO;
