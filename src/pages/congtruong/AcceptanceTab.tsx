import { useEffect, useRef, useState } from 'react'
import { Plus, X, Camera, Loader2, FileDown, Trash2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { ConstructionAcceptance, ConstructionAcceptanceItem } from '../../hooks/useSiteData'
import { compressImageToBlob } from '../../utils/imageCompress'
import { uploadImageToStorage } from '../../services/supabase'
import { SignaturePad, type SignaturePadHandle } from './SignaturePad'

interface AcceptanceTabProps {
    projectId: string
    projectName?: string
    acceptances: ConstructionAcceptance[]
    acceptanceItems: ConstructionAcceptanceItem[]
    canWrite: boolean
    createdBy?: string
    onCreate: (
        acceptance: Partial<ConstructionAcceptance> & { project_id: string; title: string },
        items: { criterion_name: string; result?: string | null; photo_urls?: string[]; note?: string }[]
    ) => Promise<boolean>
    onSetItemResult: (itemId: string, result: 'đạt' | 'không đạt' | null) => Promise<boolean>
    onUpdateStatus: (acceptanceId: string, status: ConstructionAcceptance['status']) => Promise<boolean>
    /** Xoá hẳn 1 phiếu nghiệm thu — không phục hồi được, có xác nhận trước khi gọi. */
    onDelete: (acceptanceId: string) => Promise<{ ok: boolean; error?: string }>
}

type CritStatus = 'đạt' | 'không đạt' | null
type CriterionDraft = { key: string; name: string; status: CritStatus; note: string; photos: string[] }

type PdfExportData = {
    title: string
    workName: string; address: string; soPhieu: string; ngayNghiemThu: string
    donViThiCong: string; giamSat: string; daiDienKhachHang: string
    criteria: { name: string; status: CritStatus; note: string; photos: string[] }[]
    conclusion: CritStatus
    khacPhuc: string; thoiHan: string
    sigThiCongUrl: string; sigKhachHangUrl: string
    nameThiCong: string; nameKhachHang: string
}

const STATUS_LABEL: Record<ConstructionAcceptance['status'], { label: string; cls: string }> = {
    pending: { label: 'Chưa kết luận', cls: 'bg-amber-50 text-amber-700' },
    passed: { label: 'Đạt', cls: 'bg-emerald-50 text-emerald-700' },
    failed: { label: 'Không đạt', cls: 'bg-red-50 text-red-700' },
}

const today = () => new Date().toISOString().slice(0, 10)
const emptyCriterion = (): CriterionDraft => ({ key: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', status: null, note: '', photos: [] })

const fmtDateVN = (v: string) => {
    if (!v) return '___ / ___ / ______'
    const [y, m, d] = v.split('-')
    return `${d} / ${m} / ${y}`
}

const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const [header, data] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
    const binary = atob(data)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
    return new File([arr], filename, { type: mime })
}

export const AcceptanceTab = ({ projectId, projectName, acceptances, acceptanceItems, canWrite, createdBy, onCreate, onSetItemResult, onUpdateStatus, onDelete }: AcceptanceTabProps) => {
    void onUpdateStatus
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({
        title: '', workName: '', address: '', soPhieu: '', ngayNghiemThu: today(),
        donViThiCong: 'DQH Architects', giamSat: '', daiDienKhachHang: '',
        khacPhuc: '', thoiHan: '', nameThiCong: '', nameKhachHang: '',
    })
    const [conclusion, setConclusion] = useState<CritStatus>(null)
    const [criteria, setCriteria] = useState<CriterionDraft[]>([emptyCriterion()])
    const [uploadingKey, setUploadingKey] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [exportingId, setExportingId] = useState<string | null>(null)
    const [exportData, setExportData] = useState<PdfExportData | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const sigThiCongRef = useRef<SignaturePadHandle>(null)
    const sigKhachHangRef = useRef<SignaturePadHandle>(null)
    const printRef = useRef<HTMLDivElement | null>(null)

    const openForm = () => {
        setForm(f => ({ ...f, workName: f.workName || projectName || '', ngayNghiemThu: f.ngayNghiemThu || today() }))
        setShowForm(true)
    }

    const resetForm = () => {
        setForm({
            title: '', workName: projectName || '', address: '', soPhieu: '', ngayNghiemThu: today(),
            donViThiCong: 'DQH Architects', giamSat: '', daiDienKhachHang: '',
            khacPhuc: '', thoiHan: '', nameThiCong: '', nameKhachHang: '',
        })
        setConclusion(null)
        setCriteria([emptyCriterion()])
        sigThiCongRef.current?.clear()
        sigKhachHangRef.current?.clear()
    }

    const addCriterion = () => setCriteria(prev => [...prev, emptyCriterion()])
    const removeCriterion = (key: string) => setCriteria(prev => prev.filter(c => c.key !== key))
    const updateCriterion = (key: string, patch: Partial<CriterionDraft>) =>
        setCriteria(prev => prev.map(c => c.key === key ? { ...c, ...patch } : c))
    const removePhoto = (key: string, photoIdx: number) =>
        setCriteria(prev => prev.map(c => c.key === key ? { ...c, photos: c.photos.filter((_, i) => i !== photoIdx) } : c))

    const handlePhoto = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        setUploadingKey(key)
        try {
            for (const file of files) {
                const blob = await compressImageToBlob(file, 2048, 0.85)
                const photoFile = new File([blob], `acceptance-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`, { type: blob.type })
                const url = await uploadImageToStorage(photoFile)
                setCriteria(prev => prev.map(c => c.key === key ? { ...c, photos: [...c.photos, url] } : c))
            }
        } catch (err) {
            console.error('Lỗi tải ảnh nghiệm thu:', err)
        } finally {
            setUploadingKey(null)
            e.target.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim()) return
        setSaving(true)
        try {
            let sigThiCongUrl: string | null = null
            let sigKhachHangUrl: string | null = null
            if (sigThiCongRef.current && !sigThiCongRef.current.isEmpty()) {
                sigThiCongUrl = await uploadImageToStorage(dataUrlToFile(sigThiCongRef.current.getDataUrl(), `sig-thicong-${Date.now()}.png`))
            }
            if (sigKhachHangRef.current && !sigKhachHangRef.current.isEmpty()) {
                sigKhachHangUrl = await uploadImageToStorage(dataUrlToFile(sigKhachHangRef.current.getDataUrl(), `sig-khachhang-${Date.now()}.png`))
            }
            const validCriteria = criteria.filter(c => c.name.trim())
            const status: ConstructionAcceptance['status'] = conclusion === 'đạt' ? 'passed' : conclusion === 'không đạt' ? 'failed' : 'pending'
            const ok = await onCreate(
                {
                    project_id: projectId, title: form.title, created_by: createdBy, status,
                    work_name: form.workName || null, address: form.address || null, so_phieu: form.soPhieu || null,
                    ngay_nghiem_thu: form.ngayNghiemThu || null, don_vi_thi_cong: form.donViThiCong || null,
                    giam_sat: form.giamSat || null, dai_dien_khach_hang: form.daiDienKhachHang || null,
                    khac_phuc: form.khacPhuc || null, thoi_han: form.thoiHan || null,
                    sig_thi_cong_url: sigThiCongUrl, sig_khach_hang_url: sigKhachHangUrl,
                    name_thi_cong: form.nameThiCong || null, name_khach_hang: form.nameKhachHang || null,
                },
                validCriteria.map(c => ({ criterion_name: c.name, result: c.status, photo_urls: c.photos, note: c.note || undefined }))
            )
            if (ok) {
                setShowForm(false)
                resetForm()
            } else {
                alert('Lỗi tạo phiếu nghiệm thu. Vui lòng thử lại.')
            }
        } finally {
            setSaving(false)
        }
    }

    const handleToggleItemResult = async (item: ConstructionAcceptanceItem, result: 'đạt' | 'không đạt') => {
        await onSetItemResult(item.id, item.result === result ? null : result)
    }

    const handleDeleteAcceptance = async (acc: ConstructionAcceptance) => {
        if (!window.confirm(`Xoá hẳn phiếu nghiệm thu "${acc.title}"? Không thể hoàn tác.`)) return
        setDeletingId(acc.id)
        try {
            const result = await onDelete(acc.id)
            if (!result.ok) alert(`Lỗi xoá phiếu nghiệm thu: ${result.error || 'không rõ nguyên nhân'}`)
        } finally {
            setDeletingId(null)
        }
    }

    /** Xuất PDF từ 1 phiếu đã lưu — dùng html2canvas + jsPDF, khớp đúng bố cục bản mẫu. */
    const exportSaved = (acc: ConstructionAcceptance) => {
        const items = acceptanceItems.filter(it => it.acceptance_id === acc.id)
        setExportingId(acc.id)
        setExportData({
            title: acc.title,
            workName: acc.work_name || projectName || '',
            address: acc.address || '',
            soPhieu: acc.so_phieu || '',
            ngayNghiemThu: acc.ngay_nghiem_thu || acc.created_at?.slice(0, 10) || '',
            donViThiCong: acc.don_vi_thi_cong || '',
            giamSat: acc.giam_sat || '',
            daiDienKhachHang: acc.dai_dien_khach_hang || '',
            criteria: items.map(it => ({ name: it.criterion_name, status: it.result, note: it.note || '', photos: it.photo_urls && it.photo_urls.length > 0 ? it.photo_urls : (it.photo_url ? [it.photo_url] : []) })),
            conclusion: acc.status === 'passed' ? 'đạt' : acc.status === 'failed' ? 'không đạt' : null,
            khacPhuc: acc.khac_phuc || '',
            thoiHan: acc.thoi_han || '',
            sigThiCongUrl: acc.sig_thi_cong_url || '',
            sigKhachHangUrl: acc.sig_khach_hang_url || '',
            nameThiCong: acc.name_thi_cong || '',
            nameKhachHang: acc.name_khach_hang || '',
        })
    }

    useEffect(() => {
        if (!exportData) return
        let cancelled = false
            ; (async () => {
                // Đợi React render xong khối bản in ẩn trước khi chụp.
                await new Promise(res => setTimeout(res, 60))
                const root = printRef.current
                if (!root || cancelled) { setExportData(null); setExportingId(null); return }
                const imgs = Array.from(root.querySelectorAll('img'))
                await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res })))
                try {
                    const canvas = await html2canvas(root, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
                    const pdf = new jsPDF('p', 'pt', 'a4')
                    const pageW = pdf.internal.pageSize.getWidth()
                    const pageH = pdf.internal.pageSize.getHeight()
                    const imgW = pageW
                    const imgH = canvas.height * (imgW / canvas.width)
                    let heightLeft = imgH
                    let position = 0
                    const imgData = canvas.toDataURL('image/jpeg', 0.95)
                    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
                    heightLeft -= pageH
                    while (heightLeft > 0) {
                        position = heightLeft - imgH
                        pdf.addPage()
                        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
                        heightLeft -= pageH
                    }
                    const safeTitle = (exportData.title || 'DQH').replace(/[^a-zA-Z0-9À-ỹ ]/g, '').replace(/\s+/g, '_') || 'DQH'
                    pdf.save(`PhieuNghiemThu_${safeTitle}.pdf`)
                } catch (err) {
                    console.error('Lỗi xuất PDF:', err)
                    alert('Có lỗi khi xuất PDF.')
                } finally {
                    setExportData(null)
                    setExportingId(null)
                }
            })()
        return () => { cancelled = true }
    }, [exportData])

    return (
        <div className="space-y-4">
            {canWrite && (
                <button onClick={() => (showForm ? setShowForm(false) : openForm())} className="px-4 py-2 bg-[#7A1216] hover:bg-[#5C0E11] text-white rounded-lg text-sm font-bold">
                    {showForm ? 'Đóng form' : '+ Tạo phiếu nghiệm thu'}
                </button>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiêu đề phiếu <span className="text-red-500">*</span></label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Nghiệm thu phần thô tầng 2"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" required />
                    </div>

                    <div>
                        <p className="text-xs font-bold text-[#7A1216] uppercase mb-2">I. Thông tin công trình</p>
                        <div className="space-y-2">
                            <input value={form.workName} onChange={e => setForm({ ...form, workName: e.target.value })} placeholder="Tên công trình"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            <div className="grid grid-cols-2 gap-2">
                                <input value={form.soPhieu} onChange={e => setForm({ ...form, soPhieu: e.target.value })} placeholder={`NT-${form.ngayNghiemThu.replace(/-/g, '')}`}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                                <input type="date" value={form.ngayNghiemThu} onChange={e => setForm({ ...form, ngayNghiemThu: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <input value={form.donViThiCong} onChange={e => setForm({ ...form, donViThiCong: e.target.value })} placeholder="Đơn vị thi công"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            <input value={form.giamSat} onChange={e => setForm({ ...form, giamSat: e.target.value })} placeholder="Chỉ huy trưởng / Giám sát"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                            <input value={form.daiDienKhachHang} onChange={e => setForm({ ...form, daiDienKhachHang: e.target.value })} placeholder="Đại diện khách hàng / CĐT"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-[#7A1216] uppercase">II. Tiêu chí kiểm tra</p>
                            <button type="button" onClick={addCriterion} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                <Plus size={14} /> Thêm tiêu chí
                            </button>
                        </div>
                        <div className="space-y-3">
                            {criteria.map((c, idx) => (
                                <div key={c.key} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div className="flex gap-2 items-center mb-2">
                                        <input value={c.name} onChange={e => updateCriterion(c.key, { name: e.target.value })}
                                            placeholder={`Tên tiêu chí ${idx + 1}`} className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                                        <label className="p-2 border border-dashed border-slate-300 rounded-lg cursor-pointer text-slate-500 shrink-0">
                                            {uploadingKey === c.key ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handlePhoto(c.key, e)} disabled={uploadingKey !== null} />
                                        </label>
                                        {criteria.length > 1 && (
                                            <button type="button" onClick={() => removeCriterion(c.key)} className="text-slate-500 hover:text-red-600 shrink-0">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                        <button type="button" onClick={() => updateCriterion(c.key, { status: c.status === 'đạt' ? null : 'đạt' })}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${c.status === 'đạt' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-300 text-slate-500'}`}>
                                            ✓ Đạt
                                        </button>
                                        <button type="button" onClick={() => updateCriterion(c.key, { status: c.status === 'không đạt' ? null : 'không đạt' })}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${c.status === 'không đạt' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-300 text-slate-500'}`}>
                                            ✕ Không đạt
                                        </button>
                                    </div>
                                    <input value={c.note} onChange={e => updateCriterion(c.key, { note: e.target.value })} placeholder="Ghi chú (không bắt buộc)"
                                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                                    {c.photos.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {c.photos.map((url, pi) => (
                                                <div key={pi} className="relative w-14 h-14">
                                                    <img src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                                                    <button type="button" onClick={() => removePhoto(c.key, pi)}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center">
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Bấm biểu tượng máy ảnh để chụp/tải nhiều ảnh hiện trạng cho từng tiêu chí.</p>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-[#7A1216] uppercase mb-2">III. Kết luận nghiệm thu</p>
                        <div className="flex gap-2 mb-2">
                            <button type="button" onClick={() => setConclusion(conclusion === 'đạt' ? null : 'đạt')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${conclusion === 'đạt' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-300 text-slate-500'}`}>
                                ✓ Đạt yêu cầu
                            </button>
                            <button type="button" onClick={() => setConclusion(conclusion === 'không đạt' ? null : 'không đạt')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${conclusion === 'không đạt' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-300 text-slate-500'}`}>
                                ✕ Không đạt
                            </button>
                        </div>
                        <textarea value={form.khacPhuc} onChange={e => setForm({ ...form, khacPhuc: e.target.value })} rows={2}
                            placeholder="Nội dung cần khắc phục (nếu có)..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 mb-2" />
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Thời hạn khắc phục</label>
                            <input type="date" value={form.thoiHan} onChange={e => setForm({ ...form, thoiHan: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-[#7A1216] uppercase mb-2">IV. Xác nhận các bên</p>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-slate-600 mb-1.5">Đại diện đơn vị thi công</p>
                                <SignaturePad ref={sigThiCongRef} />
                                <div className="flex items-center gap-2 mt-1.5">
                                    <input value={form.nameThiCong} onChange={e => setForm({ ...form, nameThiCong: e.target.value })} placeholder="Họ tên"
                                        className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                                    <button type="button" onClick={() => sigThiCongRef.current?.clear()} className="text-[11px] text-slate-500 underline shrink-0">Xóa chữ ký</button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-600 mb-1.5">Đại diện khách hàng / chủ đầu tư</p>
                                <SignaturePad ref={sigKhachHangRef} />
                                <div className="flex items-center gap-2 mt-1.5">
                                    <input value={form.nameKhachHang} onChange={e => setForm({ ...form, nameKhachHang: e.target.value })} placeholder="Họ tên"
                                        className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                                    <button type="button" onClick={() => sigKhachHangRef.current?.clear()} className="text-[11px] text-slate-500 underline shrink-0">Xóa chữ ký</button>
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Ký trực tiếp bằng ngón tay / bút cảm ứng ngay trên màn hình. Chữ ký sẽ được lưu cùng phiếu và chèn vào bản PDF xuất ra.</p>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                            className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-bold">
                            Huỷ
                        </button>
                        <button type="submit" disabled={saving || !form.title.trim() || uploadingKey !== null}
                            className="flex-1 py-2.5 bg-[#7A1216] hover:bg-[#5C0E11] text-white rounded-lg text-sm font-bold disabled:opacity-50">
                            {saving ? 'Đang lưu...' : 'Lưu phiếu'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {acceptances.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Chưa có phiếu nghiệm thu nào.</p>}
                {acceptances.map(acc => {
                    const items = acceptanceItems.filter(it => it.acceptance_id === acc.id)
                    const statusMeta = STATUS_LABEL[acc.status]
                    return (
                        <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">{acc.title}</span>
                                    {(acc.work_name || acc.address) && (
                                        <span className="text-[11px] text-slate-500">{[acc.work_name, acc.address].filter(Boolean).join(' · ')}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.cls}`}>{statusMeta.label}</span>
                                    <button onClick={() => exportSaved(acc)} disabled={exportingId === acc.id} title="Xuất PDF biên bản"
                                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 border border-indigo-500/30 rounded-lg px-2 py-1 disabled:opacity-50">
                                        {exportingId === acc.id ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />} PDF
                                    </button>
                                    {canWrite && (
                                        <button onClick={() => handleDeleteAcceptance(acc)} disabled={deletingId === acc.id} title="Xoá phiếu nghiệm thu"
                                            className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-2 py-1 disabled:opacity-50">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {items.map(item => {
                                    const photos = item.photo_urls && item.photo_urls.length > 0 ? item.photo_urls : (item.photo_url ? [item.photo_url] : [])
                                    return (
                                        <div key={item.id} className="bg-slate-50 rounded-lg px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-slate-700 flex-1">{item.criterion_name}</span>
                                                {canWrite ? (
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={() => handleToggleItemResult(item, 'đạt')}
                                                            className={`px-2 py-1 rounded text-[11px] font-bold ${item.result === 'đạt' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                            Đạt
                                                        </button>
                                                        <button onClick={() => handleToggleItemResult(item, 'không đạt')}
                                                            className={`px-2 py-1 rounded text-[11px] font-bold ${item.result === 'không đạt' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                            Không đạt
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500 shrink-0">{item.result || 'Chưa chấm'}</span>
                                                )}
                                            </div>
                                            {item.note && <p className="text-[11px] text-slate-500 mt-1">{item.note}</p>}
                                            {photos.length > 0 && (
                                                <div className="flex gap-1.5 flex-wrap mt-1.5">
                                                    {photos.map((url, i) => <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover border border-slate-200" />)}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Khối ẩn dùng để render "bản in" trước khi html2canvas chụp lại thành PDF */}
            {exportData && (
                <div style={{ position: 'fixed', left: -99999, top: 0, width: 794, background: '#fff' }}>
                    <div ref={printRef} style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#1a1a1a', padding: '36px 40px', width: 794, background: '#fff' }}>
                        <div style={{ borderTop: '3px solid #7A1F1F', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#7A1F1F' }}>DQH ARCHITECTS</div>
                            <div style={{ fontSize: 10, color: '#777' }}>BIÊN BẢN / PHIẾU NỘI BỘ</div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, margin: '14px 0 2px' }}>PHIẾU NGHIỆM THU HẠNG MỤC CÔNG TÁC</div>
                        <div style={{ textAlign: 'center', fontSize: 13, color: '#444', marginBottom: 10 }}>{exportData.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
                            <div>Số phiếu: {exportData.soPhieu || '—'}</div>
                            <div>Ngày nghiệm thu: {fmtDateVN(exportData.ngayNghiemThu)}</div>
                        </div>

                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A1F1F', margin: '12px 0 6px' }}>I. THÔNG TIN CÔNG TRÌNH</div>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr><td style={{ width: 170, color: '#666', padding: '3px 0' }}>Tên công trình:</td><td style={{ padding: '3px 0' }}>{exportData.workName || '—'}</td></tr>
                                <tr><td style={{ color: '#666', padding: '3px 0' }}>Địa chỉ:</td><td style={{ padding: '3px 0' }}>{exportData.address || '—'}</td></tr>
                                <tr><td style={{ color: '#666', padding: '3px 0' }}>Đơn vị thi công:</td><td style={{ padding: '3px 0' }}>{exportData.donViThiCong || '—'}</td></tr>
                                <tr><td style={{ color: '#666', padding: '3px 0' }}>Chỉ huy trưởng / Giám sát:</td><td style={{ padding: '3px 0' }}>{exportData.giamSat || '—'}</td></tr>
                                <tr><td style={{ color: '#666', padding: '3px 0' }}>Đại diện khách hàng / CĐT:</td><td style={{ padding: '3px 0' }}>{exportData.daiDienKhachHang || '—'}</td></tr>
                            </tbody>
                        </table>

                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A1F1F', margin: '14px 0 6px' }}>II. TIÊU CHÍ KIỂM TRA</div>
                        <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                            <thead>
                                <tr style={{ background: '#7A1F1F', color: '#fff' }}>
                                    <th style={{ padding: 6, width: 30 }}>STT</th>
                                    <th style={{ padding: 6, textAlign: 'left' }}>Tiêu chí kiểm tra</th>
                                    <th style={{ padding: 6, width: 90 }}>Kết quả</th>
                                    <th style={{ padding: 6, textAlign: 'left' }}>Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exportData.criteria.length === 0 && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: 6 }}>Chưa có tiêu chí</td></tr>
                                )}
                                {exportData.criteria.map((c, i) => (
                                    <tr key={i}>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center', padding: 6 }}>{i + 1}</td>
                                        <td style={{ border: '1px solid #ddd', padding: 6 }}>{c.name}</td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center', padding: 6, color: c.status === 'đạt' ? '#2fa568' : c.status === 'không đạt' ? '#c0392b' : '#999', fontWeight: 700 }}>
                                            {c.status === 'đạt' ? 'Đạt' : c.status === 'không đạt' ? 'Không đạt' : '—'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: 6 }}>{c.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A1F1F', margin: '14px 0 6px' }}>III. HÌNH ẢNH ĐÍNH KÈM</div>
                        {exportData.criteria.every(c => c.photos.length === 0) ? (
                            <div style={{ color: '#999', fontSize: 11 }}>Không có ảnh đính kèm</div>
                        ) : exportData.criteria.map((c, ci) => c.photos.length > 0 && (
                            <div key={ci} style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: '#555', marginBottom: 4, fontWeight: 700 }}>{c.name || 'Tiêu chí'}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {c.photos.map((p, pi) => <img key={pi} src={p} crossOrigin="anonymous" style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />)}
                                </div>
                            </div>
                        ))}

                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A1F1F', margin: '14px 0 6px' }}>IV. KẾT LUẬN NGHIỆM THU</div>
                        <div style={{ fontSize: 12, marginBottom: 6 }}>
                            <span style={{ color: exportData.conclusion === 'đạt' ? '#2fa568' : '#999', fontWeight: exportData.conclusion === 'đạt' ? 700 : 400 }}>☐ Đạt yêu cầu, đồng ý nghiệm thu</span>
                            &nbsp;&nbsp;&nbsp;
                            <span style={{ color: exportData.conclusion === 'không đạt' ? '#c0392b' : '#999', fontWeight: exportData.conclusion === 'không đạt' ? 700 : 400 }}>☐ Không đạt — cần khắc phục trước khi nghiệm thu lại</span>
                        </div>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Nội dung cần khắc phục: {exportData.khacPhuc || '—'}</div>
                        <div style={{ fontSize: 12 }}>Thời hạn khắc phục: {fmtDateVN(exportData.thoiHan)}</div>

                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A1F1F', margin: '16px 0 8px', borderTop: '1px solid #ddd', paddingTop: 10 }}>V. XÁC NHẬN CÁC BÊN</div>
                        <table style={{ width: '100%', fontSize: 12 }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '50%', textAlign: 'center', fontWeight: 700, paddingBottom: 4 }}>ĐẠI DIỆN ĐƠN VỊ THI CÔNG</td>
                                    <td style={{ width: '50%', textAlign: 'center', fontWeight: 700, paddingBottom: 4 }}>ĐẠI DIỆN KHÁCH HÀNG / CĐT</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'center', height: 80, verticalAlign: 'middle' }}>
                                        {exportData.sigThiCongUrl && <img src={exportData.sigThiCongUrl} crossOrigin="anonymous" style={{ maxHeight: 70, maxWidth: '100%' }} />}
                                    </td>
                                    <td style={{ textAlign: 'center', height: 80, verticalAlign: 'middle' }}>
                                        {exportData.sigKhachHangUrl && <img src={exportData.sigKhachHangUrl} crossOrigin="anonymous" style={{ maxHeight: 70, maxWidth: '100%' }} />}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'center', borderTop: '1px solid #999', paddingTop: 4 }}>Họ tên: {exportData.nameThiCong || '—'}</td>
                                    <td style={{ textAlign: 'center', borderTop: '1px solid #999', paddingTop: 4 }}>Họ tên: {exportData.nameKhachHang || '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div style={{ fontSize: 9.5, color: '#888', marginTop: 16, borderTop: '1px solid #eee', paddingTop: 6 }}>
                            DQH Architects — Thiết kế &amp; Thi công trọn gói · Phiếu tạo lúc {new Date().toLocaleString('vi-VN')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
