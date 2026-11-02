// Vật tư công trình (site_materials) và phát sinh (change_orders) cho trợ lý AI.
// AI được: xem, báo thiếu vật tư, đổi trạng thái hàng về, lập phiếu phát sinh.
// AI KHÔNG được: duyệt phát sinh thay khách hay đưa phát sinh vào tiến độ — việc đó của khách và PM.
import { db, check, CoreError } from './db.js';
import { isIsoDate, todayVN, addDays } from './text.js';
import { resolveProject } from './projects.js';

export const MAT_STATUS = ['can_dat', 'cho_chu_nha', 'da_dat', 'dang_ve', 'da_ve', 'huy'];
const MAT_LABEL = { can_dat: 'Cần đặt', cho_chu_nha: 'Chờ chủ nhà chốt', da_dat: 'Đã đặt', dang_ve: 'Đang về', da_ve: 'Đã về', huy: 'Huỷ' };

async function constructionProject(ref) {
  const p = await resolveProject(ref, 'construction');
  if (p.source !== 'construction') throw new CoreError(400, 'Vật tư và phát sinh chỉ dùng cho công trình thi công');
  return p;
}

export async function listMaterials({ project, status, overdue } = {}) {
  let q = db().from('site_materials').select('*').neq('status', 'huy').order('need_by', { ascending: true, nullsFirst: false }).limit(300);
  if (project) q = q.eq('project_id', (await constructionProject(project)).id);
  if (status === 'open' || !status) q = q.neq('status', 'da_ve');
  else if (status !== 'all') { if (!MAT_STATUS.includes(status)) throw new CoreError(400, `status phải là: open, all, ${MAT_STATUS.join(', ')}`); q = q.eq('status', status); }
  const today = todayVN();
  let rows = check(await q, 'đọc vật tư') || [];
  if (overdue) rows = rows.filter(r => r.need_by && r.need_by < today && r.status !== 'da_ve');
  return rows.map(r => ({ id: r.id, ten: r.name, so_luong: r.quantity, don_vi: r.unit, cho_hang_muc: r.for_item, can_truoc: r.need_by,
    trang_thai: MAT_LABEL[r.status] || r.status, status: r.status, tre: !!(r.need_by && r.need_by < today && r.status !== 'da_ve'),
    chu_nha_can_chot: r.status === 'cho_chu_nha' ? r.owner_choice : undefined, chu_nha_da_chot: r.owner_decision || undefined }));
}

export async function addMaterial(input, actor) {
  const { project, name, quantity, unit, for_item, need_by, owner_choice, supplier } = input || {};
  if (!project || !name) throw new CoreError(400, 'Cần công trình (project) và tên vật tư (name)');
  if (need_by && !isIsoDate(need_by)) throw new CoreError(400, 'need_by phải dạng YYYY-MM-DD');
  const p = await constructionProject(project);
  const row = { project_id: p.id, name: String(name).trim(), quantity: quantity != null ? Number(quantity) : null, unit: unit || null, for_item: for_item || null,
    need_by: need_by || addDays(todayVN(), 3), status: owner_choice ? 'cho_chu_nha' : 'can_dat', owner_choice: owner_choice || null, supplier: supplier || null, created_by: actor?.id || null };
  const rows = check(await db().from('site_materials').insert(row).select('id'), 'thêm vật tư');
  return { id: rows?.[0]?.id, cong_trinh: p.name, ten: row.name, can_truoc: row.need_by, trang_thai: MAT_LABEL[row.status] };
}

export async function setMaterialStatus({ id, status }) {
  if (!id || !MAT_STATUS.includes(status)) throw new CoreError(400, `Cần id và status (${MAT_STATUS.join(', ')})`);
  if (status === 'cho_chu_nha') throw new CoreError(400, 'Muốn chờ chủ nhà chốt thì thêm vật tư mới kèm owner_choice');
  const rows = check(await db().from('site_materials').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('name'), 'cập nhật vật tư');
  if (!rows?.length) throw new CoreError(404, 'Không tìm thấy vật tư');
  return { ten: rows[0].name, trang_thai: MAT_LABEL[status] };
}

const CO_LABEL = { cho_khach: 'Chờ khách đồng ý', khach_dong_y: 'Khách đồng ý, chờ PM đưa vào tiến độ', khach_tu_choi: 'Khách từ chối', da_vao_tien_do: 'Đã vào tiến độ', huy: 'Huỷ' };

export async function listChangeOrders({ project, status } = {}) {
  let q = db().from('change_orders').select('*').neq('status', 'huy').order('created_at', { ascending: false }).limit(200);
  if (project) q = q.eq('project_id', (await constructionProject(project)).id);
  if (status) q = q.eq('status', status);
  const rows = check(await q, 'đọc phát sinh') || [];
  return rows.map(r => ({ id: r.id, ma: r.code, noi_dung: r.title, chi_phi: Number(r.cost), them_ngay: r.extra_days, trang_thai: CO_LABEL[r.status] || r.status, status: r.status, ghi_nhan_khach: r.client_note }));
}

export async function createChangeOrder(input, actor) {
  const { project, title, description, cost, extra_days } = input || {};
  if (!project || !title || cost === undefined || cost === null) throw new CoreError(400, 'Cần công trình, nội dung (title) và chi phí (cost, ghi 0 nếu không đổi)');
  const p = await constructionProject(project);
  const existing = check(await db().from('change_orders').select('id').eq('project_id', p.id), 'đếm phát sinh') || [];
  const code = `PS-${String(existing.length + 1).padStart(2, '0')}`;
  const row = { project_id: p.id, code, title: String(title).trim(), description: description || null, cost: Number(cost) || 0, extra_days: Number(extra_days) || 0, status: 'cho_khach', requested_by: actor?.id || null };
  const rows = check(await db().from('change_orders').insert(row).select('id'), 'lập phiếu phát sinh');
  return { id: rows?.[0]?.id, ma: code, cong_trinh: p.name, noi_dung: row.title, chi_phi: row.cost, trang_thai: CO_LABEL.cho_khach,
    luu_y: 'Chỉ thi công sau khi khách đồng ý (trên link xem tiến độ hoặc ký giấy).' };
}
