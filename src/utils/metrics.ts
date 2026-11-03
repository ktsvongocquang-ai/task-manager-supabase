// MỘT cách đếm cho cả app (Tổng quan, Điều hành, Thi công, Dự án, trợ lý AI) — để mọi trang ra cùng con số.
//
// Quy ước:
//  • Việc "đã xong"   : Hoàn thành / DONE / Hủy bỏ / Lưu trữ (không còn phải làm) — khớp dqh_norm_status phía server.
//  • Việc "mẫu"       : trạng thái Chờ kích hoạt / Dự thảo (khung tiến độ chưa chạy) → KHÔNG đếm.
//  • Việc "tổng hợp"  : có việc con (parent) hoặc tên dạng "HSTC- … [TỔNG HỢP …]" → KHÔNG đếm (đếm việc con).
//  • Việc "trễ hạn"   : chưa xong, có hạn, hạn < HÔM NAY theo giờ Việt Nam (hạn đúng hôm nay chưa tính trễ).
//  • Dự án "đang chạy": không phải Hoàn thành / Đã bàn giao / Hủy / Lưu trữ / Tạm dừng.
//  • Tiến độ dự án    : tính từ việc (số việc xong / số việc được đếm), không lấy số gõ tay.

export const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)

const fold = (s?: string | null) => String(s || '').toLowerCase().normalize('NFC').trim()

export function isDoneStatus(status?: string | null): boolean {
    const s = fold(status)
    return /hoàn thành|^done$|completed|đã xong|hủy|huỷ|cancel|lưu trữ|archived|rejected/.test(s)
}
export function isTemplateStatus(status?: string | null): boolean {
    const s = fold(status)
    return s === 'chờ kích hoạt' || s === 'dự thảo' || s === 'draft' || s === 'template'
}
export function isSummaryName(name?: string | null): boolean {
    const n = String(name || '')
    return /^\s*HSTC\s*-/i.test(n) || /\[TỔNG HỢP/i.test(n)
}

type TaskLike = { id?: string; name?: string | null; status?: string | null; due_date?: string | null; end_date?: string | null; parent_id?: string | null }

/** Lọc ra các việc được tính vào số liệu (bỏ việc mẫu, việc tổng hợp có con). */
export function countableTasks<T extends TaskLike>(tasks: T[]): T[] {
    const parentIds = new Set(tasks.map(t => t.parent_id).filter(Boolean) as string[])
    return tasks.filter(t => !isTemplateStatus(t.status) && !isSummaryName(t.name) && !(t.id && parentIds.has(t.id)))
}

export function dueOf(t: TaskLike): string | null {
    const d = t.due_date || t.end_date || null
    return d ? String(d).slice(0, 10) : null
}
export function isOverdue(t: TaskLike, today = vnToday()): boolean {
    const d = dueOf(t)
    return !!d && !isDoneStatus(t.status) && d < today
}

export function taskStats<T extends TaskLike>(tasks: T[], today = vnToday()) {
    const list = countableTasks(tasks)
    const done = list.filter(t => isDoneStatus(t.status)).length
    const overdue = list.filter(t => isOverdue(t, today)).length
    return { total: list.length, done, open: list.length - done, overdue, progress: list.length ? Math.round((done / list.length) * 100) : 0 }
}

export function isActiveProject(status?: string | null): boolean {
    const s = fold(status)
    return !/hoàn thành|đã bàn giao|bàn giao xong|completed|done|hủy|huỷ|cancel|lưu trữ|archived|tạm dừng|paused/.test(s)
}
