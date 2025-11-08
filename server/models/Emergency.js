const { getDB } = require('../utils/databaseWrapper');

class EmergencyDAO {
  static async create(payload) {
    const p = { ...payload };
    if (!p.incidentCode) {
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      p.incidentCode = `EMG-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    }
    const db = getDB();
    const res = await db.run(
      'INSERT INTO emergencies (type, location, notes, status, incidentCode, departmentName, groupName, pocName, pocPhone, representativeIdDocument, representativeIdNumber, headcount, visitorFirstName, visitorLastName, visitorPhone, reason, isMinor, guardianContact, createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [p.type,p.location||'Main Lobby',p.notes||null,p.status||'Active',p.incidentCode,p.departmentName||null,p.groupName||null,p.pocName||null,p.pocPhone||null,p.representativeIdDocument||null,p.representativeIdNumber||null,p.headcount||null,p.visitorFirstName||null,p.visitorLastName||null,p.visitorPhone||null,p.reason||null,p.isMinor?1:0,p.guardianContact||null,p.createdBy||null]
    );
    const rows = await db.query('SELECT * FROM emergencies WHERE id = ?', [res.lastID]);
    return rows[0] ? { ...rows[0], _id: rows[0].id } : rows[0];
  }

  static async find(query = {}, { limit = 50, page = 1 } = {}) {
    const conds = [];
    const args = [];
    if (query.type) { conds.push('type = ?'); args.push(query.type); }
    if (query.status) { conds.push('status = ?'); args.push(query.status); }
    if (query.location) { conds.push('location = ?'); args.push(query.location); }
    if (query.createdAt) {
      if (query.createdAt.$gte) { conds.push('createdAt >= ?'); args.push(new Date(query.createdAt.$gte)); }
      if (query.createdAt.$lte) { conds.push('createdAt <= ?'); args.push(new Date(query.createdAt.$lte)); }
    }
    if (query.$or && Array.isArray(query.$or) && query.$or.length) {
      const like = [];
      for (const c of query.$or) {
        if (c.incidentCode) { like.push('incidentCode LIKE ?'); args.push(`%${c.incidentCode}%`); }
        if (c.departmentName) { like.push('departmentName LIKE ?'); args.push(`%${c.departmentName}%`); }
        if (c.pocName) { like.push('pocName LIKE ?'); args.push(`%${c.pocName}%`); }
        if (c.visitorFirstName) { like.push('visitorFirstName LIKE ?'); args.push(`%${c.visitorFirstName}%`); }
        if (c.visitorLastName) { like.push('visitorLastName LIKE ?'); args.push(`%${c.visitorLastName}%`); }
      }
      if (like.length) conds.push('(' + like.join(' OR ') + ')');
    }
    let sql = 'SELECT * FROM emergencies';
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    args.push(Number(limit), (Number(page)-1)*Number(limit));
    const db = getDB();
    const rows = await db.query(sql, args);
    let countSql = 'SELECT COUNT(*) as cnt FROM emergencies';
    const countArgs = args.slice(0, args.length - 2);
    if (conds.length) countSql += ' WHERE ' + conds.join(' AND ');
    const countRows = await db.query(countSql, countArgs);
    const mapped = rows.map(r => ({ ...r, _id: r.id }));
    return { rows: mapped, total: countRows[0].cnt };
  }

  static async findByIdAndUpdate(id, update) {
    const sets = [];
    const args = [];
    for (const [k,v] of Object.entries(update)) {
      sets.push(`${k} = ?`);
      args.push(v);
    }
    args.push(id);
    const db = getDB();
    await db.run(`UPDATE emergencies SET ${sets.join(', ')} WHERE id = ?`, args);
    const rows = await db.query('SELECT * FROM emergencies WHERE id = ?', [id]);
    return rows[0] ? { ...rows[0], _id: rows[0].id } : null;
  }
}

module.exports = EmergencyDAO;


