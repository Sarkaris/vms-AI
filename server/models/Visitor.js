const { getDB, query, run } = require('../utils/databaseWrapper');

class VisitorDAO {
  static async list(params) {
    const {
      status,
      startDate,
      endDate,
      date,
      departments,
      visitorTypes,
      purposes,
      securityLevels,
      page = 1,
      limit = 100,
    } = params || {};

    const conds = [];
    const args = [];
    if (status && status !== 'all') {
      if (Array.isArray(status)) {
        const filtered = status.filter(s => s && s !== 'all');
        if (filtered.length) {
          conds.push(`status IN (${filtered.map(()=>'?').join(',')})`);
          args.push(...filtered);
        }
      } else { conds.push('status = ?'); args.push(status); }
    }
    const start = startDate || date;
    const end = endDate || date;
    if (start && end) {
      conds.push('checkInTime BETWEEN ? AND ?');
      args.push(new Date(new Date(start).setHours(0,0,0,0)), new Date(new Date(end).setHours(23,59,59,999)));
    }
    if (departments) {
      const arr = Array.isArray(departments) ? departments : String(departments).split(',');
      conds.push(`purpose IN (${arr.map(()=>'?').join(',')})`);
      args.push(...arr);
    }
    if (visitorTypes) {
      const arr = Array.isArray(visitorTypes) ? visitorTypes : String(visitorTypes).split(',');
      conds.push(`company IN (${arr.map(()=>'?').join(',')})`);
      args.push(...arr);
    }
    if (purposes) {
      const arr = Array.isArray(purposes) ? purposes : String(purposes).split(',');
      conds.push(`purpose IN (${arr.map(()=>'?').join(',')})`);
      args.push(...arr);
    }
    if (securityLevels) {
      const arr = Array.isArray(securityLevels) ? securityLevels : String(securityLevels).split(',');
      conds.push(`securityLevel IN (${arr.map(()=>'?').join(',')})`);
      args.push(...arr);
    }

    let sql = 'SELECT * FROM visitors';
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    let nLimit = Number(limit);
    let nPage = Number(page);
    if (!Number.isFinite(nLimit) || nLimit <= 0) nLimit = 100;
    if (!Number.isFinite(nPage) || nPage <= 0) nPage = 1;
    const nOffset = (nPage - 1) * nLimit;
    // Inline LIMIT/OFFSET as validated integers (some MySQL versions reject bound params here)
    sql += ` ORDER BY checkInTime DESC LIMIT ${nLimit} OFFSET ${nOffset}`;
    const rows = await query(sql, args);

    let countSql = 'SELECT COUNT(*) as cnt FROM visitors';
    if (conds.length) countSql += ' WHERE ' + conds.join(' AND ');
    const countRows = await query(countSql, args);

    const mapped = rows.map(r => ({ ...r, _id: r.id }));
    return { rows: mapped, total: countRows[0].cnt, page: nPage, limit: nLimit };
  }

  static async create(payload) {
    const p = { ...payload };
    if (p.email) p.email = String(p.email).toLowerCase().trim();
    const res = await run(
      'INSERT INTO visitors (firstName,lastName,email,phone,company,purpose,expectedDuration,checkInTime,checkOutTime,status,badgeId,qrCode,photo,aadhaarId,panId,passportId,drivingLicenseId,temperature,healthDeclaration,notes,location,isVip,securityLevel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [p.firstName,p.lastName,p.email,p.phone,p.company||null,p.purpose,p.expectedDuration||60,new Date(),null,'Checked In',p.badgeId,p.qrCode||p.badgeId,p.photo||null,p.aadhaarId||null,p.panId||null,p.passportId||null,p.drivingLicenseId||null,p.temperature||null,p.healthDeclaration?1:0,p.notes||null,p.location||'Main Lobby',p.isVip?1:0,p.securityLevel||'Low']
    );
    const rows = await query('SELECT * FROM visitors WHERE id = ?', [res.lastID]);
    return rows[0] ? { ...rows[0], _id: rows[0].id } : null;
  }

  static async findOneByIdentifier(identifier, possibleBadgeId, isDataUrl) {
    const raw = String(identifier || '').trim();
    const onlyDigits = raw.replace(/\D+/g, '');
    const args = [raw, raw, raw, raw, raw, raw, raw, raw, onlyDigits];
    let sql = "SELECT * FROM visitors WHERE badgeId=? OR qrCode=? OR phone=? OR email=? OR aadhaarId=? OR panId=? OR passportId=? OR drivingLicenseId=? OR REPLACE(REPLACE(REPLACE(REPLACE(phone,'-',''),' ',''),'(',''),')','') = ?";
    if (possibleBadgeId) { sql += ' OR badgeId=?'; args.push(possibleBadgeId); }
    if (isDataUrl) { sql += " OR qrCode LIKE 'data:image/%'"; }
    sql += ' ORDER BY createdAt DESC LIMIT 1';
    const rows = await query(sql, args);
    return rows[0] ? { ...rows[0], _id: rows[0].id } : null;
  }

  static async findById(id) {
    const rows = await query('SELECT * FROM visitors WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? { ...rows[0], _id: rows[0].id } : null;
  }

  static async checkout(id) {
    await run('UPDATE visitors SET checkOutTime = ?, status = ? WHERE id = ?', [new Date(), 'Checked Out', id]);
    return this.findById(id);
  }

  static async updateEditable(id, updates) {
    const editable = ['firstName','lastName','email','phone','company','purpose','notes','aadhaarId','panId','passportId','drivingLicenseId'];
    const sets = [];
    const args = [];
    for (const k of editable) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) {
        sets.push(`${k} = ?`);
        args.push(updates[k]);
      }
    }
    if (!sets.length) return this.findById(id);
    args.push(id);
    await run(`UPDATE visitors SET ${sets.join(', ')} WHERE id = ?`, args);
    return this.findById(id);
  }

  static async deleteById(id) {
    const res = await run('DELETE FROM visitors WHERE id = ?', [id]);
    return res.changes > 0;
  }

  static async getCurrentActive() {
    const rows = await query("SELECT * FROM visitors WHERE status = 'Checked In' ORDER BY checkInTime DESC");
    return rows.map(r => ({ ...r, _id: r.id }));
  }

  static async getOverdue() {
    const rows = await query("SELECT * FROM visitors WHERE status = 'Checked In'");
    const now = Date.now();
    return rows.map(r => ({ ...r, _id: r.id })).filter(v => {
      const expected = new Date(v.checkInTime).getTime() + (Number(v.expectedDuration||60) * 60000);
      return now > expected;
    });
  }

  static async getStatsSummary() {
    const start = new Date(new Date().setHours(0,0,0,0));
    const end = new Date(new Date().setHours(23,59,59,999));
    const today = await query('SELECT COUNT(*) as count FROM visitors WHERE checkInTime BETWEEN ? AND ?', [start, end]);
    const current = await query("SELECT COUNT(*) as count FROM visitors WHERE status='Checked In'");
    const total = await query('SELECT COUNT(*) as count FROM visitors');
    const byPurpose = await query('SELECT purpose as _id, COUNT(*) as count FROM visitors GROUP BY purpose');
    return { today: [today], current: [current], total: [total], byPurpose };
  }
}

module.exports = VisitorDAO;