// Trợ năng chung cho cả app (A11Y-01/02), chạy 1 lần khi mở app:
//  1. Nút chỉ có biểu tượng mà không có nhãn -> tự gắn aria-label (lấy từ title, hoặc đoán theo biểu tượng).
//  2. Phím Esc đóng hộp thoại/modal đang nổi trên cùng (bấm nút X của nó; không có X thì bấm vào nền mờ).
const ICON_LABELS: [RegExp, string][] = [
    [/lucide-x\b|lucide-circle-x|lucide-x-circle/, 'Đóng'], [/lucide-trash/, 'Xoá'], [/lucide-pencil|lucide-pen|lucide-edit|lucide-square-pen/, 'Sửa'],
    [/lucide-plus/, 'Thêm'], [/lucide-more|lucide-ellipsis/, 'Thêm thao tác'], [/lucide-chevron-left|lucide-arrow-left/, 'Quay lại'],
    [/lucide-chevron-right|lucide-arrow-right/, 'Tiếp'], [/lucide-chevron-down/, 'Mở rộng'], [/lucide-chevron-up/, 'Thu gọn'],
    [/lucide-search/, 'Tìm'], [/lucide-bell/, 'Thông báo'], [/lucide-menu/, 'Menu'], [/lucide-refresh|lucide-rotate/, 'Làm mới'],
    [/lucide-download/, 'Tải về'], [/lucide-upload/, 'Tải lên'], [/lucide-share/, 'Chia sẻ'], [/lucide-filter|lucide-funnel/, 'Lọc'],
    [/lucide-calendar/, 'Chọn ngày'], [/lucide-eye-off/, 'Ẩn'], [/lucide-eye/, 'Xem'], [/lucide-send/, 'Gửi'], [/lucide-check/, 'Xác nhận'],
    [/lucide-copy/, 'Sao chép'], [/lucide-log-out/, 'Đăng xuất'], [/lucide-settings|lucide-cog/, 'Cài đặt'], [/lucide-camera/, 'Chụp ảnh'],
    [/lucide-image/, 'Chọn ảnh'], [/lucide-mic/, 'Ghi âm'], [/lucide-sparkles|lucide-wand/, 'Gợi ý AI'], [/lucide-zoom-in/, 'Phóng to'],
    [/lucide-zoom-out/, 'Thu nhỏ'], [/lucide-message/, 'Tin nhắn'], [/lucide-phone/, 'Gọi'], [/lucide-printer/, 'In'],
    [/lucide-users/, 'Thành viên'], [/lucide-user/, 'Tài khoản'], [/lucide-home|lucide-house/, 'Trang chủ'], [/lucide-link/, 'Liên kết'],
    [/lucide-grip|lucide-move/, 'Kéo để sắp xếp'], [/lucide-star/, 'Đánh dấu'], [/lucide-pin/, 'Ghim'], [/lucide-external-link/, 'Mở trang mới'],
]

function labelFor(btn: HTMLElement): string | null {
    const title = btn.getAttribute('title')
    if (title) return title
    const svg = btn.querySelector('svg')
    const cls = svg?.getAttribute('class') || ''
    for (const [re, label] of ICON_LABELS) if (re.test(cls)) return label
    return null
}

function fixButtons(root: ParentNode) {
    root.querySelectorAll?.('button:not([aria-label]), [role="button"]:not([aria-label])').forEach(el => {
        const btn = el as HTMLElement
        if ((btn.textContent || '').trim()) return // đã có chữ
        const label = labelFor(btn)
        if (label) btn.setAttribute('aria-label', label)
    })
}

function topOverlay(): HTMLElement | null {
    const all = Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0, [role="dialog"]'))
        .filter(el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
        .filter(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden')
    if (!all.length) return null
    const z = (el: HTMLElement) => Number(getComputedStyle(el).zIndex) || 0
    return all.reduce((a, b) => (z(b) >= z(a) ? b : a))
}

function onEscape(e: KeyboardEvent) {
    if (e.key !== 'Escape' || e.defaultPrevented) return
    const ov = topOverlay()
    if (!ov) return
    const scope: HTMLElement = ov.getAttribute('role') === 'dialog' ? (ov.closest('.fixed.inset-0') as HTMLElement) || ov : ov
    const close = scope.querySelector<HTMLElement>('button[aria-label="Đóng"], button[aria-label*="Đóng"], button[title*="Đóng"], button[aria-label="Close"]')
        || Array.from(scope.querySelectorAll<HTMLElement>('button')).find(b => /lucide-x\b/.test(b.querySelector('svg')?.getAttribute('class') || '') && !(b.textContent || '').trim())
    if (close) { close.click(); return }
    // Không có nút X: nếu nền mờ là phần tử rỗng thì bấm vào nền (đa số modal đóng khi bấm nền)
    const backdrop = Array.from(scope.parentElement?.children || []).concat([scope]).find(el => el.classList.contains('inset-0') && !el.children.length) as HTMLElement | undefined
    backdrop?.click()
}

let started = false
export function startA11yHelpers() {
    if (started || typeof window === 'undefined') return
    started = true
    fixButtons(document)
    let pending = false
    new MutationObserver(() => {
        if (pending) return
        pending = true
        requestAnimationFrame(() => { pending = false; fixButtons(document) })
    }).observe(document.body, { childList: true, subtree: true })
    window.addEventListener('keydown', onEscape)
}
