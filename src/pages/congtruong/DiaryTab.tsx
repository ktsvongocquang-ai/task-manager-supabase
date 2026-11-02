import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Image as ImageIcon, Loader2, X, Plus, Pencil, Trash2, ChevronDown, ChevronUp, StickyNote, CheckCircle2, ClipboardCheck, Share2 } from 'lucide-react'
import { addDays, format } from 'date-fns'
import type { SupabaseDailyLog, DailyLogItem, ConstructionAcceptance, SupabaseTask } from '../../hooks/useSiteData'
import { compressImageToBlob } from '../../utils/imageCompress'
import { uploadImageToStorage } from '../../services/supabase'

interface DiaryTabProps {
    projectId: string
    logs: SupabaseDailyLog[]
    dailyLogItems: DailyLogItem[]
    /** Trộn chung phiếu Nghiệm thu vào danh sách Nhật ký (mỗi dòng gắn nhãn loại) — không bắt buộc. */
    acceptances?: ConstructionAcceptance[]
    /** Task thật của dự án (từ Bảng tiến độ) — dùng gợi ý tên hạng mục khi gõ + gợi ý việc ngày mai. */
    tasks?: SupabaseTask[]
    /** Bấm vào 1 dòng Nghiệm thu trong danh sách trộn chung -> chuyển sang tab Nghiệm thu. */
    onOpenAcceptance?: () => void
    /** Tên + mã dự án — chỉ dùng để ghép vào nội dung báo cáo chia sẻ, không ảnh hưởng dữ liệu lưu. */
    projectName?: string
    projectCode?: string | null
    engineerId?: string
    /** Tên người tạo — hiện trong báo cáo chia sẻ ("Người tạo: ..."). */
    engineerName?: string
    canWrite: boolean
    onSubmit: (payload: Partial<SupabaseDailyLog>) => Promise<SupabaseDailyLog | null>
    onUpdate: (logId: string, updates: Partial<SupabaseDailyLog>) => Promise<{ ok: boolean; error?: string }>
    /** Xoá hẳn 1 nhật ký — không phục hồi được, có xác nhận trước khi gọi. */
    onDelete: (logId: string) => Promise<{ ok: boolean; error?: string }>
    onSaveItems: (dailyLogId: string, items: { item_name: string; unit?: string; quantity?: number; man_hours?: number; equipment?: string }[]) => Promise<boolean>
    onDeleteItems: (dailyLogId: string) => Promise<boolean>
    /** initialMode cho phép trang chủ mở thẳng vào đúng phần (Chụp ảnh / Ghi chú) thay vì form đầy đủ */
    initialMode?: 'full' | 'photo' | 'note'
    /** Bấm vào 1 dòng cụ thể trong "Hoạt động gần đây" ở Trang chủ -> mở thẳng form sửa đúng dòng đó
     * thay vì chỉ nhảy tới danh sách chung. */
    initialEditLogId?: string
    onFormOpened?: () => void
}

/** Nhãn loại cho từng dòng trong danh sách trộn chung Nhật ký/Ghi chú/Ảnh nhanh. */
const MODE_META: Record<string, { label: string; icon: any; cls: string }> = {
    full: { label: 'Nhật ký thi công', icon: CheckCircle2, cls: 'text-emerald-600' },
    photo: { label: 'Ảnh nhanh', icon: Camera, cls: 'text-sky-600' },
    note: { label: 'Ghi chú', icon: StickyNote, cls: 'text-amber-600' },
}
const ACC_STATUS_META: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Chưa kết luận', cls: 'text-amber-600' },
    passed: { label: 'Đạt', cls: 'text-emerald-600' },
    failed: { label: 'Không đạt', cls: 'text-red-600' },
}

const today = () => new Date().toISOString().slice(0, 10)
const WEATHER_OPTIONS = ['Nắng', 'Mưa', 'Râm']
// Chỉ còn Sáng/Chiều — Trưa/Tối/Đêm hiếm khi dùng thực tế, bỏ cho gọn form.
const WEATHER_PERIODS: { key: string; label: string }[] = [
    { key: 'sang', label: 'Sáng' }, { key: 'chieu', label: 'Chiều' },
]
// Bỏ "Chất lượng" — thực tế không ai tự chấm công trình mình đang làm là kém, giữ lại chỉ gây nhiễu.
const QUALITY_CRITERIA: { key: string; label: string }[] = [
    { key: 'an_toan', label: 'An toàn' },
    { key: 'tien_do', label: 'Tiến độ' }, { key: 've_sinh', label: 'Vệ sinh' },
]
const QUALITY_LEVELS = ['Tốt', 'Trung bình', 'Kém']

type WorkItemDraft = { item_name: string; unit: string; quantity: string }
type ChecklistDraft = { id: string; label: string; completed: boolean }

export const DiaryTab = ({ projectId, logs, dailyLogItems, tasks, acceptances, onOpenAcceptance, projectName, projectCode, engineerId, engineerName, canWrite, onSubmit, onUpdate, onDelete, onSaveItems, onDeleteItems, initialMode, initialEditLogId, onFormOpened }: DiaryTabProps) => {
    const [showForm, setShowForm] = useState(initialMode !== undefined)
    const [mode] = useState<'full' | 'photo' | 'note'>(initialMode || 'full')
    const [saving, setSaving] = useState(false)
    const [editingLogId, setEditingLogId] = useState<string | null>(null)
    const [uploadingPhoto, setUploadingPhoto] = useState<'work' | 'incident' | null>(null)
    const [uploadProgress, setUploadProgress] = useState('')
    const [workPhotos, setWorkPhotos] = useState<string[]>([])
    const [incidentPhotos, setIncidentPhotos] = useState<string[]>([])
    const [weatherPeriods, setWeatherPeriods] = useState<Record<string, string>>({})
    const [qualityRatings, setQualityRatings] = useState<Record<string, string>>({})
    const [workItems, setWorkItems] = useState<WorkItemDraft[]>([])
    const [checklist, setChecklist] = useState<ChecklistDraft[]>([])
    const [newChecklistLabel, setNewChecklistLabel] = useState('')
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
    /** Log đang bấm "+N" để xem hết ảnh — mặc định mỗi log chỉ hiện 4 ảnh đầu, tránh render hàng trăm ảnh cùng lúc khi có nhiều bản ghi/nhiều ảnh mỗi ngày. */
    const [expandedPhotosLogId, setExpandedPhotosLogId] = useState<string | null>(null)
    const [deletingLogId, setDeletingLogId] = useState<string | null>(null)
    const [isIssue, setIsIssue] = useState(false)
    /** Đang chuẩn bị/chờ chia sẻ hệ thống (Web Share API) — 'form' cho form đang mở, hoặc log.id cho 1 bản ghi đã lưu. */
    const [sharingKey, setSharingKey] = useState<string | null>(null)
    /** Index dòng Khối lượng công việc đang hiện dropdown gợi ý tên task (tự dựng — <datalist> gốc không mở được trên mobile). */
    const [suggestFor, setSuggestFor] = useState<number | null>(null)
    const workItemInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
    /** Hiện dropdown gợi ý cho ô "Hạng mục" ở đầu form — xổ từ Bảng tiến độ, vẫn sửa tay được. */
    const [showHangMucSuggest, setShowHangMucSuggest] = useState(false)
    /** Tên việc đã bấm "+ Thêm" từ gợi ý "Việc dự kiến ngày mai" — chỉ để disable nút, tránh thêm trùng dòng vào Kế hoạch ngày mai. */
    const [addedTomorrowNames, setAddedTomorrowNames] = useState<Set<string>>(new Set())
    const [form, setForm] = useState({
        date: today(), work_item: '', team_name: '', temperature: '', main_workers: '', sub_workers: '', helper_workers: '',
        progress: '', notes: '', today_summary: '', tomorrow_plan: '',
    })
    const workPhotoInputRef = useRef<HTMLInputElement>(null)
    const autoOpenedCameraRef = useRef(false)

    // ── Bản nháp: tự lưu vào máy khi đang ghi nhật ký MỚI (chạm ra ngoài, bấm Back, mất mạng, tải lại trang
    // đều không mất). Mở form lần sau tự điền lại; lưu xong thì xoá nháp.
    const DRAFT_KEY = `dqh_diary_draft_${projectId}`
    const restoredRef = useRef(false)
    const restoreDraft = () => {
        try {
            const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
            if (!d) return false
            setForm(f => ({ ...f, ...d.form })); setWorkPhotos(d.workPhotos || []); setIncidentPhotos(d.incidentPhotos || [])
            setWorkItems(d.workItems || []); setChecklist(d.checklist || []); setIsIssue(!!d.isIssue)
            setWeatherPeriods(d.weatherPeriods || {}); setQualityRatings(d.qualityRatings || {})
            return true
        } catch { return false }
    }
    const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }
    useEffect(() => {
        if (!showForm || editingLogId) return
        const hasContent = !!(form.work_item || form.notes || form.today_summary || form.tomorrow_plan || form.main_workers || workPhotos.length || incidentPhotos.length || workItems.length || checklist.length)
        if (!hasContent) return
        const t = setTimeout(() => {
            try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, workPhotos, incidentPhotos, workItems, checklist, isIssue, weatherPeriods, qualityRatings, at: Date.now() })) } catch { /* bộ nhớ đầy */ }
        }, 400)
        return () => clearTimeout(t)
    }, [showForm, editingLogId, form, workPhotos, incidentPhotos, workItems, checklist, isIssue, weatherPeriods, qualityRatings, DRAFT_KEY])
    // Mở form mới từ nút nhanh (initialMode) -> điền lại nháp nếu có
    useEffect(() => {
        if (showForm && !editingLogId && !restoredRef.current) { restoredRef.current = true; restoreDraft() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showForm])
    // Đóng form: KHÔNG xoá nháp (lần mở sau tự điền lại). Esc cũng đóng được.
    const closeForm = () => { setShowForm(false); resetForm(); restoredRef.current = false }
    useEffect(() => {
        if (!showForm) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeForm() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showForm])

    // "Chụp ảnh" (mode='photo') mở form mới (không phải sửa) -> tự bật camera ngay, không bắt
    // người dùng phải bấm "Thêm ảnh" trước — đúng ý "bấm zô là ra luôn camera".
    useEffect(() => {
        if (mode === 'photo' && !editingLogId && !autoOpenedCameraRef.current) {
            autoOpenedCameraRef.current = true
            workPhotoInputRef.current?.click()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const addChecklistItem = () => {
        const label = newChecklistLabel.trim()
        if (!label) return
        setChecklist(prev => [...prev, { id: `c-${Date.now()}`, label, completed: false }])
        setNewChecklistLabel('')
    }
    const removeChecklistItem = (id: string) => setChecklist(prev => prev.filter(c => c.id !== id))

    const resetForm = () => {
        setForm({ date: today(), work_item: '', team_name: '', temperature: '', main_workers: '', sub_workers: '', helper_workers: '', progress: '', notes: '', today_summary: '', tomorrow_plan: '' })
        setWorkPhotos([]); setIncidentPhotos([]); setWeatherPeriods({}); setQualityRatings({}); setWorkItems([])
        setChecklist([]); setNewChecklistLabel(''); setIsIssue(false)
        setEditingLogId(null)
        setAddedTomorrowNames(new Set())
    }

    const startEdit = (log: SupabaseDailyLog) => {
        setForm({
            date: log.date || today(),
            work_item: log.work_item || '',
            team_name: log.team_name || '',
            temperature: log.temperature != null ? String(log.temperature) : '',
            main_workers: log.main_workers != null ? String(log.main_workers) : '',
            sub_workers: log.sub_workers != null ? String(log.sub_workers) : '',
            helper_workers: log.helper_workers != null ? String(log.helper_workers) : '',
            progress: log.progress != null ? String(log.progress) : '',
            notes: log.notes || '',
            today_summary: log.today_summary || '',
            tomorrow_plan: log.tomorrow_plan || '',
        })
        setWorkPhotos(log.photo_urls || [])
        setIncidentPhotos(log.incident_photo_urls || [])
        setWeatherPeriods(log.weather_periods || {})
        setQualityRatings(log.quality_ratings || {})
        setChecklist(log.checklist || [])
        setIsIssue(!!log.is_issue)
        const items = dailyLogItems.filter(it => it.daily_log_id === log.id)
        setWorkItems(items.map(it => ({
            item_name: it.item_name, unit: it.unit || '', quantity: it.quantity != null ? String(it.quantity) : '',
        })))
        setEditingLogId(log.id)
        setAddedTomorrowNames(new Set())
        setShowForm(true)
    }

    const handleDeleteLog = async (log: SupabaseDailyLog) => {
        const label = log.work_item || log.date
        if (!window.confirm(`Xoá hẳn nhật ký "${label}"? Không thể hoàn tác.`)) return
        setDeletingLogId(log.id)
        try {
            const result = await onDelete(log.id)
            if (!result.ok) alert(`Lỗi xoá nhật ký: ${result.error || 'không rõ nguyên nhân'}`)
        } finally {
            setDeletingLogId(null)
        }
    }

    // Bấm 1 dòng cụ thể ở "Hoạt động gần đây" (Trang chủ) -> mở thẳng form sửa đúng dòng đó,
    // thay vì chỉ nhảy tới tab Nhật ký rồi phải tự tìm lại trong danh sách.
    useEffect(() => {
        if (!initialEditLogId) return
        const log = logs.find(l => l.id === initialEditLogId)
        if (log) startEdit(log)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialEditLogId])

    const openForm = () => {
        if (showForm) { closeForm(); return }
        resetForm() // mở mới -> form sạch, rồi điền lại nháp (nếu có) qua effect phía trên
        restoredRef.current = false
        setShowForm(true)
        onFormOpened?.()
    }

    const handlePhotoChange = async (kind: 'work' | 'incident', e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        setUploadingPhoto(kind)
        try {
            for (let i = 0; i < files.length; i++) {
                setUploadProgress(files.length > 1 ? `Đang tải ${i + 1}/${files.length}...` : 'Đang tải...')
                // 1600px/0.8 (nhẹ hơn bản cũ 2048/0.85) — máy yếu bớt giật khi nén ảnh gốc từ camera điện thoại.
                const blob = await compressImageToBlob(files[i], 1600, 0.8)
                const photoFile = new File([blob], `diary-${kind}-${Date.now()}-${i}.webp`, { type: blob.type })
                const url = await uploadImageToStorage(photoFile)
                if (kind === 'work') setWorkPhotos(prev => [...prev, url])
                else setIncidentPhotos(prev => [...prev, url])
            }
        } catch (err) {
            console.error('Lỗi tải ảnh nhật ký:', err)
            alert('Lỗi tải ảnh lên. Vui lòng thử lại.')
        } finally {
            setUploadingPhoto(null)
            setUploadProgress('')
            e.target.value = '' // reset để chọn lại đúng ảnh cũ vẫn kích hoạt onChange lần nữa
        }
    }

    const addWorkItem = (presetName?: string) =>
        setWorkItems(prev => [...prev, { item_name: presetName || '', unit: '', quantity: '' }])
    const updateWorkItem = (idx: number, patch: Partial<WorkItemDraft>) =>
        setWorkItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
    const removeWorkItem = (idx: number) => setWorkItems(prev => prev.filter((_, i) => i !== idx))

    /** Tên các task thật của dự án (Bảng tiến độ) — gợi ý khi gõ tên hạng mục trong Khối lượng công việc. */
    const taskNames = useMemo(() => Array.from(new Set((tasks || []).map(t => t.name).filter(Boolean))), [tasks])

    /** Task chưa xong, rơi vào ngày mai theo lịch — gợi ý nhanh vào Khối lượng công việc hôm nay. */
    const tomorrowTasks = useMemo(() => {
        if (!tasks || tasks.length === 0) return []
        const tmr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
        return tasks.filter(t => t.status !== 'DONE' && t.start_date && t.start_date <= tmr && (!t.end_date || t.end_date >= tmr))
    }, [tasks])

    const VN_WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
    const fmtDateFull = (dateStr: string) => {
        const d = new Date(`${dateStr}T00:00:00`)
        if (isNaN(d.getTime())) return dateStr
        return `${VN_WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    type ReportData = {
        date: string; workItem?: string | null; teamName?: string | null; progress?: number | null;
        mainWorkers?: number | null; subWorkers?: number | null; helperWorkers?: number | null;
        weatherPeriods?: Record<string, string> | null; qualityRatings?: Record<string, string> | null;
        notes?: string | null; todaySummary?: string | null; tomorrowPlan?: string | null;
        checklist?: { id: string; label: string; completed: boolean }[] | null;
    }

    /** Tốt/Trung bình/Kém -> icon + nhãn chuyên nghiệp hơn (khớp mẫu báo cáo tham khảo). */
    const QUALITY_STATUS_MAP: Record<string, { icon: string; label: string }> = {
        'Tốt': { icon: '✅', label: 'Tốt' },
        'Trung bình': { icon: '⚠️', label: 'Cần theo dõi' },
        'Kém': { icon: '⚠️', label: 'Cần cải thiện' },
    }

    /** Tách từng dòng người dùng tự gõ (có/không có gạch đầu dòng sẵn) thành bullet đồng nhất —
     * tự bỏ ký hiệu gạch đầu dòng cũ, viết hoa chữ cái đầu, rồi thêm lại đúng 1 prefix. */
    const toBullets = (text?: string | null, prefix = '•'): string[] =>
        (text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
            const clean = l.replace(/^[-•✔️❗📅]\s*/, '')
            const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1)
            return `${prefix} ${capitalized}`
        })

    /** Nội dung báo cáo dùng chung cho cả form đang tạo lẫn nhật ký đã lưu — chia khối rõ ràng (TÌNH HÌNH
     * CHUNG / CÔNG VIỆC HÔM NAY / KẾ HOẠCH NGÀY MAI / NỘI DUNG CẦN XỬ LÝ), bỏ trống các dòng chưa có dữ liệu
     * thay vì hiện "Không" — khớp mẫu báo cáo gọn, chuyên nghiệp người dùng tham khảo.
     * audience='customer' bỏ khối "NỘI DUNG CẦN XỬ LÝ" (checklist còn dở + ghi chú) — chỉ giữ cho bản Nội bộ. */
    const buildReportText = (d: ReportData, audience: 'internal' | 'customer' = 'internal') => {
        const lines = ['🏗️ BÁO CÁO THI CÔNG HẰNG NGÀY']
        const projHeader = [projectCode ? `[${projectCode}]` : '', projectName].filter(Boolean).join(' ')
        const headerLine = [projHeader, d.workItem].filter(Boolean).join(' — ')
        lines.push([headerLine, `📅 ${fmtDateFull(d.date)}`].filter(Boolean).join(' '))

        // Nhóm 1: Thời tiết + An toàn + Vệ sinh (gộp 1 dòng). Bỏ "Chất lượng" khỏi báo cáo chia sẻ (nhạy cảm,
        // không phù hợp gửi ra ngoài) — vẫn còn trong form nhập liệu, chỉ không đưa vào bản chia sẻ.
        const group1: string[] = []
        const wp = d.weatherPeriods || {}
        const weatherParts = ['sang', 'chieu', 'toi', 'dem']
            .map(k => ({ key: k, label: { sang: 'Sáng', chieu: 'Chiều', toi: 'Tối', dem: 'Đêm' }[k as 'sang'], val: wp[k] }))
            .filter(w => w.val)
        // Chỉ giữ icon ✅/⚠️ cho các mục TRẠNG THÁI (An toàn/Vệ sinh/Tiến độ) — đây là tín hiệu có ý nghĩa
        // (tốt hay cần chú ý). Thời tiết/Nhân công/% tiến độ là dữ liệu thô, bỏ icon cho đỡ rối mắt.
        if (weatherParts.length) group1.push(`Thời tiết: ${weatherParts.map(w => `${w.label} ${w.val}`).join(', ')}`)
        const qr = d.qualityRatings || {}
        const qualityLine = (key: string, label: string) => {
            const val = qr[key]
            if (!val) return null
            const mapped = QUALITY_STATUS_MAP[val] || { icon: 'ℹ️', label: val }
            return `${mapped.icon} ${label}: ${mapped.label}`
        }
        const antoan = qualityLine('an_toan', 'An toàn'); if (antoan) group1.push(antoan)
        const vesinh = qualityLine('ve_sinh', 'Vệ sinh'); if (vesinh) group1.push(vesinh)

        // Nhóm 2: Tiến độ + Nhân công — xuống dòng riêng, tách khỏi nhóm 1.
        const group2: string[] = []
        const tiendo = qualityLine('tien_do', 'Tiến độ'); if (tiendo) group2.push(tiendo)
        const totalWorkers = (d.mainWorkers || 0) + (d.subWorkers || 0) + (d.helperWorkers || 0)
        if (totalWorkers > 0) group2.push(`Nhân công: ${totalWorkers} người`)
        if (d.progress != null) group2.push(`Tiến độ hạng mục: ${d.progress}%`)

        if (group1.length || group2.length) {
            lines.push('', 'TÌNH HÌNH CHUNG')
            if (group1.length) lines.push(group1.join(' '))
            if (group2.length) lines.push(group2.join(' '))
        }

        const todayBullets = toBullets(d.todaySummary, '✔️')
        if (todayBullets.length) lines.push('', 'CÔNG VIỆC HÔM NAY', ...todayBullets)

        const tomorrowBullets = toBullets(d.tomorrowPlan, '📅')
        if (tomorrowBullets.length) lines.push('', 'KẾ HOẠCH NGÀY MAI', ...tomorrowBullets)

        if (audience === 'internal') {
            const pendingChecklist = (d.checklist || []).filter(c => !c.completed).map(c => `❗ ${c.label}`)
            const issueLines = [...pendingChecklist, ...toBullets(d.notes, '❗')]
            if (issueLines.length) lines.push('', 'NỘI DUNG CẦN XỬ LÝ', ...issueLines)
        }

        return lines.join('\n')
    }

    const buildSummaryText = (audience: 'internal' | 'customer' = 'internal') => buildReportText({
        date: form.date, workItem: form.work_item, teamName: form.team_name,
        progress: form.progress ? Number(form.progress) : null,
        mainWorkers: form.main_workers ? Number(form.main_workers) : null,
        subWorkers: form.sub_workers ? Number(form.sub_workers) : null,
        helperWorkers: form.helper_workers ? Number(form.helper_workers) : null,
        weatherPeriods, qualityRatings, notes: form.notes,
        todaySummary: form.today_summary, tomorrowPlan: form.tomorrow_plan, checklist,
    }, audience)

    /** Bản báo cáo của 1 nhật ký ĐÃ LƯU (khác buildSummaryText — đọc từ log đã lưu, dùng cho nút Chia sẻ trong danh sách). */
    const buildLogShareText = (log: SupabaseDailyLog, audience: 'internal' | 'customer' = 'internal') => buildReportText({
        date: log.date, workItem: log.work_item, teamName: log.team_name, progress: log.progress,
        mainWorkers: log.main_workers, subWorkers: log.sub_workers, helperWorkers: log.helper_workers,
        weatherPeriods: log.weather_periods, qualityRatings: log.quality_ratings, notes: log.notes,
        todaySummary: log.today_summary, tomorrowPlan: log.tomorrow_plan, checklist: log.checklist,
    }, audience)

    /** Chia sẻ NỘI DUNG CHỮ qua bảng chia sẻ hệ thống — người dùng tự chọn Zalo/nhóm nào để gửi, không cần
     * bot/API Zalo. Trước đây có thử tự đính kèm ảnh (tải lại từ Supabase, nén, gộp vào navigator.share) —
     * bỏ hẳn vì Zalo báo "Có lỗi xảy ra" khi nhận gộp nhiều ảnh + chữ qua share-sheet iOS dù đã nén nhẹ,
     * lỗi xảy ra phía nhận (Zalo), không sửa được từ phía app. Giờ chỉ chia sẻ chữ (luôn ổn định), ảnh
     * người dùng tự đính kèm thủ công từ điện thoại/album trong Zalo. */
    const shareViaSystem = async (text: string, key: string) => {
        setSharingKey(key)
        try {
            if (navigator.share) {
                try {
                    await navigator.share({ title: 'Báo cáo thi công', text })
                } catch (err: any) {
                    if (err?.name !== 'AbortError') {
                        console.error('Lỗi chia sẻ:', err)
                        await navigator.clipboard.writeText(text).catch(() => {})
                        alert('Chia sẻ thất bại. Đã copy nội dung báo cáo — dán thủ công vào Zalo.')
                    }
                }
            } else {
                await navigator.clipboard.writeText(text)
                alert('Trình duyệt này không hỗ trợ chia sẻ trực tiếp — đã copy nội dung báo cáo, dán thủ công vào Zalo.')
            }
        } finally {
            setSharingKey(null)
        }
    }

    /** Lưu form hiện tại (tạo mới hoặc cập nhật) — dùng chung cho nút "Lưu nhật ký" lẫn 2 nút
     * "Gửi nội bộ/khách hàng", vì gửi báo cáo cũng phải lưu lại nhật ký trên app, không chỉ chia sẻ chữ. */
    const saveEntry = async (): Promise<boolean> => {
        setSaving(true)
        try {
            const payload = {
                project_id: projectId,
                date: form.date,
                work_item: form.work_item || null as any,
                team_name: form.team_name || null as any,
                weather_morning: weatherPeriods.sang || null as any,
                weather_afternoon: weatherPeriods.chieu || null as any,
                weather_periods: Object.keys(weatherPeriods).length ? weatherPeriods : null,
                quality_ratings: Object.keys(qualityRatings).length ? qualityRatings : null,
                temperature: form.temperature ? Number(form.temperature) : null as any,
                main_workers: form.main_workers ? Number(form.main_workers) : null as any,
                sub_workers: form.sub_workers ? Number(form.sub_workers) : null as any,
                helper_workers: form.helper_workers ? Number(form.helper_workers) : null as any,
                progress: form.progress ? Number(form.progress) : null as any,
                notes: form.notes || null as any,
                today_summary: form.today_summary || null as any,
                tomorrow_plan: form.tomorrow_plan || null as any,
                photo_urls: workPhotos,
                incident_photo_urls: incidentPhotos,
                checklist: checklist,
                is_issue: isIssue,
                status: 'pending' as any,
                engineer_id: engineerId || null as any,
            }

            let logId: string | null = null
            if (editingLogId) {
                const result = await onUpdate(editingLogId, payload)
                if (!result.ok) {
                    alert(`Lỗi cập nhật nhật ký: ${result.error || 'không rõ nguyên nhân'}`)
                    return false
                }
                logId = editingLogId
                await onDeleteItems(editingLogId)
            } else {
                // entry_mode chỉ set lúc tạo mới — không ghi đè khi sửa (form sửa luôn ở mode 'full'
                // dù bản ghi gốc là Ghi chú/Ảnh nhanh, không nên đổi nhãn phân loại của nó).
                const created = await onSubmit({ ...payload, entry_mode: mode })
                if (!created) {
                    alert('Lỗi lưu nhật ký. Vui lòng thử lại.')
                    return false
                }
                logId = created.id
            }

            const validItems = workItems.filter(it => it.item_name.trim())
            if (validItems.length > 0 && logId) {
                await onSaveItems(logId, validItems.map(it => ({
                    item_name: it.item_name,
                    unit: it.unit || undefined,
                    quantity: it.quantity ? Number(it.quantity) : undefined,
                })))
            }

            return true
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const ok = await saveEntry()
        if (ok) {
            if (!editingLogId) clearDraft()
            setShowForm(false)
            resetForm()
        }
    }

    /** Lưu nhật ký rồi mới mở bảng chia sẻ hệ thống — gửi báo cáo không còn là hành động "chỉ chia sẻ chữ,
     * quên lưu" nữa, luôn kèm lưu để danh sách nhật ký khớp với nội dung vừa gửi đi. */
    const handleSaveAndShare = async (audience: 'internal' | 'customer') => {
        const text = buildSummaryText(audience)
        const ok = await saveEntry()
        if (!ok) return
        if (!editingLogId) clearDraft()
        await shareViaSystem(text, audience === 'internal' ? 'form-internal' : 'form-customer')
        setShowForm(false)
        resetForm()
    }

    const PhotoRow = ({ urls, onRemove }: { urls: string[]; onRemove: (i: number) => void }) => (
        <div className="flex flex-wrap gap-2">
            {urls.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                    <img src={url} alt="Ảnh" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                    <button type="button" onClick={() => onRemove(i)} className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full shadow p-0.5">
                        <X size={14} className="text-slate-600" />
                    </button>
                </div>
            ))}
        </div>
    )

    // Trộn chung Nhật ký/Ghi chú/Ảnh nhanh (logs) với Nghiệm thu (acceptances) thành 1 danh sách theo ngày,
    // mỗi dòng gắn nhãn loại — tránh nhầm lẫn "vì sao Ghi chú/Nghiệm thu lại nằm trong Nhật ký".
    type FeedItem = { key: string; date: string; kind: 'log'; log: SupabaseDailyLog } | { key: string; date: string; kind: 'acceptance'; acceptance: ConstructionAcceptance }
    const feedItems: FeedItem[] = useMemo(() => {
        const logItems: FeedItem[] = logs.map(l => ({ key: 'log-' + l.id, date: l.created_at || l.date, kind: 'log', log: l }))
        const accItems: FeedItem[] = (acceptances || []).map(a => ({ key: 'acc-' + a.id, date: a.created_at, kind: 'acceptance', acceptance: a }))
        return [...logItems, ...accItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [logs, acceptances])

    return (
        <div className="space-y-4">
            {canWrite && (
                <button
                    onClick={openForm}
                    className="px-4 py-2 bg-[#7A1216] hover:bg-[#5C0E11] text-white rounded-lg text-sm font-bold"
                >
                    {showForm ? 'Đóng form' : '+ Ghi nhật ký hôm nay'}
                </button>
            )}

            {showForm && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <div role="dialog" aria-modal="true" aria-label="Ghi nhật ký" className="relative bg-white border border-slate-200 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
                        <div className="sticky top-0 z-10 px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                            <h3 className="text-base font-bold text-slate-800">{editingLogId ? 'Sửa nhật ký' : 'Ghi nhật ký hôm nay'}</h3>
                            <button type="button" onClick={closeForm} className="text-slate-500 hover:text-slate-800 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        {editingLogId && (
                            <div className="mx-5 mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                Đang sửa nhật ký ngày {form.date} — lưu lại để cập nhật.
                            </div>
                        )}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" required />
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{mode === 'note' ? 'Tiêu đề ghi chú' : 'Hạng mục'}</label>
                            <input value={form.work_item} onChange={e => setForm({ ...form, work_item: e.target.value })}
                                onFocus={() => mode !== 'note' && setShowHangMucSuggest(true)}
                                onBlur={() => setTimeout(() => setShowHangMucSuggest(false), 150)}
                                placeholder={mode === 'note' ? 'VD: Kiểm tra lại vị trí đặt hố ga, lỗi nứt tường...' : 'Gõ hoặc chọn từ Bảng tiến độ'}
                                required={mode === 'note'}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            {showHangMucSuggest && mode !== 'note' && (() => {
                                const suggestions = taskNames.filter(n => n.toLowerCase().includes(form.work_item.toLowerCase())).slice(0, 8)
                                if (!suggestions.length) return null
                                return (
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {suggestions.map(name => (
                                            <button key={name} type="button"
                                                onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, work_item: name })); setShowHangMucSuggest(false) }}
                                                className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 border-b border-slate-100 last:border-0">
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>
                    </div>

                    {mode !== 'photo' && mode !== 'note' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tổ đội</label>
                                <input value={form.team_name} onChange={e => setForm({ ...form, team_name: e.target.value })}
                                    placeholder="VD: Mr Tiến, Đội sắt..."
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            </div>

                            {/* Thời tiết Sáng/Chiều */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thời tiết trong ngày</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {WEATHER_PERIODS.map(period => (
                                        <div key={period.key}>
                                            <p className="text-xs text-slate-500 text-center mb-1">{period.label}</p>
                                            <select
                                                value={weatherPeriods[period.key] || ''}
                                                onChange={e => setWeatherPeriods(prev => ({ ...prev, [period.key]: e.target.value }))}
                                                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="">--</option>
                                                {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tình hình thi công — 4 tiêu chí */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tình hình thi công</label>
                                <div className="space-y-2">
                                    {QUALITY_CRITERIA.map(c => (
                                        <div key={c.key}>
                                            <p className="text-[11px] text-slate-500 mb-1">{c.label}</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {QUALITY_LEVELS.map(level => (
                                                    <button
                                                        key={level} type="button"
                                                        onClick={() => setQualityRatings(prev => ({ ...prev, [c.key]: level }))}
                                                        className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${qualityRatings[c.key] === level ? 'bg-[#7A1216] border-[#7A1216] text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NC chính</label>
                                    <input type="number" value={form.main_workers} onChange={e => setForm({ ...form, main_workers: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NC phụ</label>
                                    <input type="number" value={form.sub_workers} onChange={e => setForm({ ...form, sub_workers: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giám sát</label>
                                    <input type="number" value={form.helper_workers} onChange={e => setForm({ ...form, helper_workers: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>

                            {/* Khối lượng công việc */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Khối lượng công việc</label>
                                    <button type="button" onClick={() => addWorkItem()} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                        <Plus size={14} /> Thêm hạng mục
                                    </button>
                                </div>
                                {workItems.length === 0 && <p className="text-xs text-slate-500">Chưa có hạng mục nào.</p>}
                                <div className="space-y-2">
                                    {workItems.map((it, idx) => {
                                        const suggestions = suggestFor === idx
                                            ? taskNames.filter(n => n.toLowerCase().includes(it.item_name.toLowerCase())).slice(0, 8)
                                            : []
                                        return (
                                        <div key={idx} className="border border-slate-200 rounded-lg p-2 space-y-1.5">
                                            <div className="flex gap-2 items-center relative">
                                                <input value={it.item_name}
                                                    ref={el => { workItemInputRefs.current[idx] = el }}
                                                    onChange={e => updateWorkItem(idx, { item_name: e.target.value })}
                                                    onFocus={() => setSuggestFor(idx)}
                                                    onBlur={() => setTimeout(() => setSuggestFor(prev => prev === idx ? null : prev), 150)}
                                                    placeholder="Tên hạng mục (gõ để tìm trong Bảng tiến độ)" className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                                                <button type="button" onClick={() => removeWorkItem(idx)} className="text-slate-500 hover:text-red-600 shrink-0">
                                                    <X size={16} />
                                                </button>
                                                {suggestions.length > 0 && (
                                                    <div className="absolute z-20 top-full left-0 right-8 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {suggestions.map(name => (
                                                            <button key={name} type="button"
                                                                onMouseDown={e => { e.preventDefault(); updateWorkItem(idx, { item_name: name }); setSuggestFor(null) }}
                                                                className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 border-b border-slate-100 last:border-0">
                                                                {name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 mb-0.5">Số lượng</label>
                                                    <input value={it.quantity} onChange={e => updateWorkItem(idx, { quantity: e.target.value })}
                                                        type="number" placeholder="VD: 10" className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 mb-0.5">Đơn vị tính</label>
                                                    <input value={it.unit} onChange={e => updateWorkItem(idx, { unit: e.target.value })}
                                                        placeholder="VD: m2, md, cái" className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                        </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Công việc hôm nay</label>
                                <textarea value={form.today_summary} onChange={e => setForm({ ...form, today_summary: e.target.value })} rows={3}
                                    placeholder={'VD: - Tháo dỡ bếp (bảo quản lại vòi + chậu rửa)\n- Tháo dỡ trần WC'}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            </div>
                            {/* Gợi ý từ Bảng tiến độ: việc chưa xong và theo lịch vẫn còn chạy tới ngày mai —
                                bấm + Thêm để đưa thẳng vào ô "Kế hoạch ngày mai" bên dưới, đỡ phải gõ lại tên việc. */}
                            {tomorrowTasks.length > 0 && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                    <p className="text-xs font-bold text-indigo-700 uppercase mb-1">📅 Gợi ý việc ngày mai (theo Bảng tiến độ)</p>
                                    <p className="text-[11px] text-indigo-600/80 mb-2">Các việc chưa xong, theo lịch vẫn đang chạy đến ngày mai. Bấm "+ Thêm" để đưa vào ô Kế hoạch ngày mai — checklist nghiệm thu của việc đó (nếu có) cũng tự nối vào ô Checklist bên dưới.</p>
                                    <div className="space-y-1.5">
                                        {tomorrowTasks.map(t => {
                                            const added = addedTomorrowNames.has(t.name)
                                            return (
                                                <div key={t.id} className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-indigo-100">
                                                    <span className="text-xs text-slate-700 flex-1 truncate">{t.name}</span>
                                                    <button type="button" disabled={added} onClick={() => {
                                                        setForm(prev => ({ ...prev, tomorrow_plan: prev.tomorrow_plan ? `${prev.tomorrow_plan}\n- ${t.name}` : `- ${t.name}` }))
                                                        setAddedTomorrowNames(prev => new Set(prev).add(t.name))
                                                        // Nối luôn checklist nghiệm thu của việc này (nếu có, gán từ popup chi tiết task
                                                        // bên Bảng tiến độ) vào Checklist của nhật ký — đỡ phải gõ lại tay.
                                                        const taskChecklist: { label?: string }[] = Array.isArray((t as any).checklist) ? (t as any).checklist : []
                                                        if (taskChecklist.length > 0) {
                                                            setChecklist(prev => {
                                                                const existingLabels = new Set(prev.map(c => c.label))
                                                                const additions = taskChecklist
                                                                    .map(c => c.label)
                                                                    .filter((label): label is string => !!label && !existingLabels.has(label))
                                                                    .map(label => ({ id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label, completed: false }))
                                                                return [...prev, ...additions]
                                                            })
                                                        }
                                                    }}
                                                        className={`text-[11px] font-bold shrink-0 ${added ? 'text-emerald-600' : 'text-indigo-600 hover:text-indigo-700'}`}>
                                                        {added ? '✓ Đã thêm' : '+ Thêm'}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kế hoạch ngày mai</label>
                                <textarea value={form.tomorrow_plan} onChange={e => setForm({ ...form, tomorrow_plan: e.target.value })} rows={3}
                                    placeholder={'VD: - Tháo TBVS (bảo quản)\n- Tháo trần WC tầng 2'}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ảnh thi công</label>
                        <div className="space-y-2">
                            <PhotoRow urls={workPhotos} onRemove={i => setWorkPhotos(prev => prev.filter((_, idx) => idx !== i))} />
                            <div className="flex gap-2">
                                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 cursor-pointer">
                                    {uploadingPhoto === 'work' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                    {uploadingPhoto === 'work' ? (uploadProgress || 'Đang tải...') : 'Chụp ảnh'}
                                    <input ref={workPhotoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoChange('work', e)} disabled={uploadingPhoto !== null} />
                                </label>
                                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 cursor-pointer">
                                    <ImageIcon size={16} />
                                    Chọn từ máy
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoChange('work', e)} disabled={uploadingPhoto !== null} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {mode === 'photo' && (
                        <button type="button" onClick={() => setIsIssue(v => !v)}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border transition-colors ${isIssue ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-slate-300 text-slate-500'}`}>
                            ⚠️ Đánh dấu lỗi cần sửa
                        </button>
                    )}

                    {/* Checklist */}
                    {mode !== 'photo' && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Checklist</label>
                        </div>
                        {checklist.length === 0 && <p className="text-xs text-slate-500 mb-2">Chưa có checklist nào.</p>}
                        <div className="space-y-1.5 mb-2">
                            {checklist.map(c => (
                                <div key={c.id} className="flex items-center gap-2">
                                    <input type="checkbox" checked={c.completed}
                                        onChange={e => setChecklist(prev => prev.map(x => x.id === c.id ? { ...x, completed: e.target.checked } : x))}
                                        className="w-4 h-4 accent-[#7A1216]" />
                                    <span className={`flex-1 text-sm ${c.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{c.label}</span>
                                    <button type="button" onClick={() => removeChecklistItem(c.id)} className="text-slate-500 hover:text-red-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={newChecklistLabel} onChange={e => setNewChecklistLabel(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                                placeholder="+ Thêm mục kiểm tra..."
                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            <button type="button" onClick={addChecklistItem} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:border-slate-400">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    )}

                    {mode !== 'photo' && mode !== 'note' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ảnh sự cố (nếu có)</label>
                            <div className="space-y-2">
                                <PhotoRow urls={incidentPhotos} onRemove={i => setIncidentPhotos(prev => prev.filter((_, idx) => idx !== i))} />
                                <div className="flex gap-2">
                                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-red-300 rounded-lg text-sm text-slate-500 cursor-pointer">
                                        {uploadingPhoto === 'incident' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                        {uploadingPhoto === 'incident' ? (uploadProgress || 'Đang tải...') : 'Chụp ảnh'}
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoChange('incident', e)} disabled={uploadingPhoto !== null} />
                                    </label>
                                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-red-300 rounded-lg text-sm text-slate-500 cursor-pointer">
                                        <ImageIcon size={16} />
                                        Chọn từ máy
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoChange('incident', e)} disabled={uploadingPhoto !== null} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú / sự cố</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                            placeholder="Vấn đề phát sinh, đề xuất..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={closeForm}
                            className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-bold">
                            Huỷ
                        </button>
                        <button type="submit" disabled={saving || uploadingPhoto !== null}
                            className="flex-1 py-2.5 bg-[#7A1216] hover:bg-[#5C0E11] text-white rounded-lg text-sm font-bold disabled:opacity-50">
                            {saving ? 'Đang lưu...' : editingLogId ? 'Cập nhật nhật ký' : 'Lưu nhật ký'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" disabled={saving || sharingKey === 'form-internal'}
                            title="Lưu nhật ký rồi chia sẻ nội dung đầy đủ (kèm CV cần kiểm tra + Ghi chú) cho nhóm nội bộ — ảnh tự đính kèm thêm trong Zalo"
                            onClick={() => handleSaveAndShare('internal')}
                            className="py-2.5 border border-indigo-600 text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
                            <Share2 size={13} /> {sharingKey === 'form-internal' ? 'Đang chuẩn bị...' : saving ? 'Đang lưu...' : 'Gửi nội bộ'}
                        </button>
                        <button type="button" disabled={saving || sharingKey === 'form-customer'}
                            title="Lưu nhật ký rồi chia sẻ nội dung rút gọn (không có CV cần kiểm tra, Ghi chú) cho khách hàng — ảnh tự đính kèm thêm trong Zalo"
                            onClick={() => handleSaveAndShare('customer')}
                            className="py-2.5 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
                            <Share2 size={13} /> {sharingKey === 'form-customer' ? 'Đang chuẩn bị...' : saving ? 'Đang lưu...' : 'Gửi khách hàng'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center -mt-1">Nội dung được chia sẻ dạng chữ — vào Zalo tự đính kèm thêm ảnh từ điện thoại nếu cần.</p>
                    </form>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {feedItems.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Chưa có nhật ký nào.</p>}
                {feedItems.map(item => {
                    if (item.kind === 'acceptance') {
                        const acc = item.acceptance
                        const statusMeta = ACC_STATUS_META[acc.status] || ACC_STATUS_META.pending
                        return (
                            <button key={item.key} type="button" onClick={onOpenAcceptance}
                                className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-800">{acc.title}</span>
                                </div>
                                <p className="text-xs flex items-center gap-1.5">
                                    <ClipboardCheck size={12} className="text-emerald-600" />
                                    <span className="text-emerald-600 font-medium">Nghiệm thu</span>
                                    <span className="text-slate-500">· {new Date(acc.created_at).toLocaleDateString('vi-VN')}</span>
                                    <span className={statusMeta.cls}>· {statusMeta.label}</span>
                                </p>
                            </button>
                        )
                    }
                    const log = item.log
                    const modeMeta = MODE_META[log.entry_mode || 'full'] || MODE_META.full
                    const items = dailyLogItems.filter(it => it.daily_log_id === log.id)
                    return (
                        <div key={item.key} className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">{log.date}</span>
                                    {log.work_item && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{log.work_item}</span>}
                                    {log.team_name && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">👷 {log.team_name}</span>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button type="button" disabled={sharingKey === `${log.id}-internal`}
                                        title="Chia sẻ nội dung đầy đủ cho nhóm nội bộ — ảnh tự đính kèm thêm trong Zalo" onClick={() => shareViaSystem(buildLogShareText(log, 'internal'), `${log.id}-internal`)}
                                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
                                        <Share2 size={12} /> {sharingKey === `${log.id}-internal` ? '...' : 'Nội bộ'}
                                    </button>
                                    <button type="button" disabled={sharingKey === `${log.id}-customer`}
                                        title="Chia sẻ nội dung rút gọn cho khách hàng — ảnh tự đính kèm thêm trong Zalo" onClick={() => shareViaSystem(buildLogShareText(log, 'customer'), `${log.id}-customer`)}
                                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                                        <Share2 size={12} /> {sharingKey === `${log.id}-customer` ? '...' : 'Khách'}
                                    </button>
                                    {canWrite && (
                                        <button type="button" onClick={() => startEdit(log)}
                                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                            <Pencil size={12} /> Sửa
                                        </button>
                                    )}
                                    {canWrite && (
                                        <button type="button" disabled={deletingLogId === log.id} title="Xoá nhật ký"
                                            onClick={() => handleDeleteLog(log)}
                                            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs flex items-center gap-1.5 mb-2">
                                <modeMeta.icon size={12} className={modeMeta.cls} />
                                <span className={`${modeMeta.cls} font-medium`}>{modeMeta.label}</span>
                                {log.is_issue && (
                                    <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded-full text-[10px]">⚠️ Cần sửa</span>
                                )}
                            </p>
                            {log.weather_periods && (
                                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mb-2">
                                    {WEATHER_PERIODS.map(p => log.weather_periods?.[p.key] && (
                                        <span key={p.key}>{p.label}: {log.weather_periods![p.key]}</span>
                                    ))}
                                </div>
                            )}
                            {log.quality_ratings && (
                                <div className="text-xs flex flex-wrap gap-2 mb-2">
                                    {QUALITY_CRITERIA.map(c => log.quality_ratings?.[c.key] && (
                                        <span key={c.key} className={`px-2 py-0.5 rounded-full ${log.quality_ratings![c.key] === 'Tốt' ? 'bg-emerald-50 text-emerald-700' : log.quality_ratings![c.key] === 'Kém' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {c.label}: {log.quality_ratings![c.key]}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mb-2">
                                {log.main_workers != null && <span>NC chính: {log.main_workers}</span>}
                                {log.sub_workers != null && <span>NC phụ: {log.sub_workers}</span>}
                                {log.helper_workers != null && <span>Giám sát: {log.helper_workers}</span>}
                                {log.progress != null && <span>Tiến độ: {log.progress}%</span>}
                            </div>
                            {items.length > 0 && (
                                <div className="text-xs text-slate-500 mb-2">
                                    {items.map(it => (
                                        <div key={it.id}>
                                            • {it.item_name}{it.quantity != null ? `: ${it.quantity} ${it.unit || ''}` : ''}
                                            {it.man_hours != null && ` · ${it.man_hours} giờ công`}
                                            {it.equipment && ` · ${it.equipment}`}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {log.today_summary && (
                                <div className="text-xs text-slate-600 mb-2">
                                    <span className="font-bold text-slate-500">Hôm nay:</span>
                                    {toBullets(log.today_summary, '-').map((line, i) => <div key={i}>{line}</div>)}
                                </div>
                            )}
                            {log.tomorrow_plan && (
                                <div className="text-xs text-slate-600 mb-2">
                                    <span className="font-bold text-slate-500">Ngày mai:</span>
                                    {toBullets(log.tomorrow_plan, '-').map((line, i) => <div key={i}>{line}</div>)}
                                </div>
                            )}
                            {log.notes && <p className="text-sm text-slate-600 mb-2">{log.notes}</p>}
                            {log.photo_urls?.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-[10px] text-slate-500 mb-1">Ảnh thi công ({log.photo_urls.length})</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {(expandedPhotosLogId === log.id ? log.photo_urls : log.photo_urls.slice(0, 4)).map((url, i) => (
                                            <img key={i} src={url} alt="Ảnh nhật ký" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                                        ))}
                                        {log.photo_urls.length > 4 && expandedPhotosLogId !== log.id && (
                                            <button type="button" onClick={() => setExpandedPhotosLogId(log.id)}
                                                className="w-16 h-16 shrink-0 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[11px] font-bold text-indigo-600">
                                                +{log.photo_urls.length - 4}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {log.incident_photo_urls && log.incident_photo_urls.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-[10px] text-red-600 mb-1">Ảnh sự cố</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {log.incident_photo_urls.map((url, i) => (
                                            <img key={i} src={url} alt="Ảnh sự cố" className="w-16 h-16 object-cover rounded-lg border border-red-200" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {log.checklist && log.checklist.length > 0 && (
                                <div className="border-t border-slate-200 pt-2">
                                    <button type="button" onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)}
                                        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">
                                        {expandedLogId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        Checklist {log.checklist.filter(c => c.completed).length}/{log.checklist.length}
                                    </button>
                                    {expandedLogId === log.id && (
                                        <div className="mt-2 space-y-1.5">
                                            {log.checklist.map(c => (
                                                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={c.completed}
                                                        onChange={e => {
                                                            const updated = log.checklist!.map(x => x.id === c.id ? { ...x, completed: e.target.checked } : x)
                                                            onUpdate(log.id, { checklist: updated })
                                                        }}
                                                        className="w-4 h-4 accent-[#7A1216]" />
                                                    <span className={`text-sm ${c.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{c.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
