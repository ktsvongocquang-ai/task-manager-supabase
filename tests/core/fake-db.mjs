// Supabase giả (trong bộ nhớ) đủ cho các truy vấn lib/core dùng. Ghi lại mọi insert/update để kiểm tra.
export function fakeDb(seed) {
  const tables = structuredClone(seed);
  const log = { inserts: [], updates: [] };
  let n = 0;
  class Q {
    constructor(t) { this.t = t; this.f = []; this.op = 'select'; this.lim = Infinity; this.ord = null; }
    select() { return this; }
    eq(c, v) { this.f.push(r => r[c] === v); return this; }
    neq(c, v) { this.f.push(r => r[c] !== v); return this; }
    in(c, a) { this.f.push(r => a.includes(r[c])); return this; }
    lt(c, v) { this.f.push(r => r[c] != null && r[c] < v); return this; }
    lte(c, v) { this.f.push(r => r[c] != null && r[c] <= v); return this; }
    gte(c, v) { this.f.push(r => r[c] != null && r[c] >= v); return this; }
    is(c, v) { this.f.push(r => (r[c] ?? null) === v); return this; }
    or(expr) {
      const parts = expr.split(/,(?![^{]*})/).map(p => {
        const [col, op, ...rest] = p.split('.'); const val = rest.join('.');
        if (op === 'cs') { const id = val.replace(/[{}]/g, ''); return r => (r[col] || []).includes(id); }
        if (op === 'ilike') { const s = val.replace(/\*/g, '').toLowerCase(); return r => String(r[col] || '').toLowerCase().includes(s); }
        throw new Error('or op ' + op);
      });
      this.f.push(r => parts.some(fn => fn(r))); return this;
    }
    order(c, o = {}) { this.ord = [c, o.ascending !== false]; return this; }
    limit(k) { this.lim = k; return this; }
    insert(row) { this.op = 'insert'; this.row = row; return this; }
    update(set) { this.op = 'update'; this.set = set; return this; }
    delete() { this.op = 'delete'; return this; }
    then(ok, bad) {
      try {
        tables[this.t] ??= [];
        if (this.op === 'insert') {
          if (this.t === 'ai_cron_runs' && tables[this.t].some(r => r.job === this.row.job && r.run_date === this.row.run_date))
            return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate' } }).then(ok, bad);
          const rows = (Array.isArray(this.row) ? this.row : [this.row]).map(r => ({ id: `new-${++n}`, ...r }));
          tables[this.t].push(...rows); log.inserts.push({ table: this.t, rows });
          return Promise.resolve({ data: rows.map(r => ({ id: r.id })), error: null }).then(ok, bad);
        }
        let rows = tables[this.t].filter(r => this.f.every(fn => fn(r)));
        if (this.op === 'update') {
          rows.forEach(r => Object.assign(r, this.set)); log.updates.push({ table: this.t, set: this.set, count: rows.length });
          return Promise.resolve({ data: rows, error: null }).then(ok, bad);
        }
        if (this.op === 'delete') {
          tables[this.t] = tables[this.t].filter(r => !rows.includes(r));
          return Promise.resolve({ data: null, error: null }).then(ok, bad);
        }
        if (this.ord) { const [c, asc] = this.ord; rows = [...rows].sort((a, b) => (a[c] ?? '￿') < (b[c] ?? '￿') ? (asc ? -1 : 1) : (a[c] ?? '￿') > (b[c] ?? '￿') ? (asc ? 1 : -1) : 0); }
        return Promise.resolve({ data: rows.slice(0, this.lim), error: null }).then(ok, bad);
      } catch (e) { return Promise.reject(e).then(ok, bad); }
    }
  }
  return { from: t => new Q(t), tables, log, auth: { getUser: async () => ({ data: null, error: { message: 'no' } }) } };
}

export const P = {
  quang: '11111111-1111-4111-8111-111111111111',
  thang: '22222222-2222-4222-8222-222222222222',
  minh: '33333333-3333-4333-8333-333333333333',
  minh2: '44444444-4444-4444-8444-444444444444',
};
export const PR = {
  core: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  ct: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

export function seed(today) {
  return {
    profiles: [
      { id: P.quang, full_name: 'Võ Ngọc Quang', email: 'quang@dqh.vn', role: 'Admin' },
      { id: P.thang, full_name: 'Nguyễn Văn Thắng', email: 'thang@dqh.vn', role: 'Quản lý' },
      { id: P.minh, full_name: 'Trần Minh', email: 'minh@dqh.vn', role: 'Thiết kế' },
      { id: P.minh2, full_name: 'Lê Văn Minh', email: 'minhle@dqh.vn', role: 'Thi công' },
    ],
    v_projects: [
      { id: PR.core, source: 'core', name: 'Biệt thự Thảo Điền', project_code: 'TD01', status: 'Đang thực hiện', address: 'Q2' },
      { id: PR.ct, source: 'construction', name: 'Căn hộ Sunrise Q7', project_code: 'Q7-SR', status: 'active', address: 'Quận 7', client_name: 'Anh Bình' },
    ],
    tasks: [
      { id: 't1', project_id: PR.core, task_code: 'TD01-01' },
      { id: 't2', project_id: PR.core, task_code: 'TD01-02' },
    ],
    v_tasks: [
      { id: 't1', source: 'core', project_id: PR.core, project_source: 'core', title: 'Chốt layout', status: 'doing', status_raw: 'Đang thực hiện', assignee_ids: [P.minh], due_date: '2000-01-01', progress_pct: 50 },
      { id: 't2', source: 'core', project_id: PR.core, project_source: 'core', title: 'Bản vẽ bếp', status: 'todo', status_raw: 'Chưa bắt đầu', assignee_ids: [P.minh], due_date: today, progress_pct: 0 },
      { id: 'c1', source: 'construction', project_id: PR.ct, project_source: 'construction', title: 'Đi ống điện tầng 2', status: 'doing', status_raw: 'DOING', assignee_ids: [], assignee_name: 'Thắng', due_date: '2000-01-02', progress_pct: 30 },
      { id: 'c2', source: 'construction', project_id: PR.ct, project_source: 'construction', title: 'Ốp gạch WC', status: 'done', status_raw: 'DONE', assignee_ids: [], assignee_name: 'Thắng', due_date: '2000-01-03', progress_pct: 100 },
    ],
    v_logs: [
      { id: 'l1', source: 'construction_diary', project_id: PR.ct, kind: 'nhat_ky', log_date: today, content: 'Thiếu gạch 60x60, thang máy chưa bàn giao', is_issue: true, author_id: P.thang },
    ],
    ai_api_keys: [], ai_audit_log: [], ai_cron_runs: [], ai_chat_pending: [],
  };
}
