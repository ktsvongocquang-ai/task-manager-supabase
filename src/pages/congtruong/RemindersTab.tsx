import { useState } from 'react'
import { Trash2, Bell, Plus, X, Camera, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { ConstructionReminder } from '../../hooks/useSiteData'
import { compressImageToBlob } from '../../utils/imageCompress'
import { uploadImageToStorage } from '../../services/supabase'

interface ProfileOption { id: string; full_name: string }

interface RemindersTabProps {
    projectId: string
    reminders: ConstructionReminder[]
    profiles: ProfileOption[]
    canWrite: boolean
    createdBy?: string
    onCreate: (reminder: {
        project_id: string; title: string; due_date?: string | null; assignee_id?: string | null; created_by?: string;
        category?: string | null; checklist?: { id: string; label: string; completed: boolean }[]; photo_urls?: string[];
        assignee_name?: string | null;
    }) => Promise<boolean>
    onToggleStatus: (reminderId: string, status: 'pending' | 'done') => Promise<boolean>
    onUpdate: (reminderId: string, updates: Partial<ConstructionReminder>) => Promise<boolean>
    onDelete: (reminderId: string) => Promise<boolean>
}

type ChecklistDraft = { id: string; label: string; completed: boolean }

export const RemindersTab = ({ projectId, reminders, profiles, canWrite, createdBy, onCreate, onToggleStatus, onUpdate, onDelete }: RemindersTabProps) => {
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [assigneeId, setAssigneeId] = useState('')
    const [assigneeName, setAssigneeName] = useState('')
    const [checklist, setChecklist] = useState<ChecklistDraft[]>([])
    const [newChecklistLabel, setNewChecklistLabel] = useState('')
    const [photoUrls, setPhotoUrls] = useState<string[]>([])
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [saving, setSaving] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const resetForm = () => {
        setTitle(''); setCategory(''); setDueDate(''); setAssigneeId(''); setAssigneeName('')
        setChecklist([]); setNewChecklistLabel(''); setPhotoUrls([])
    }

    const addChecklistItem = () => {
        const label = newChecklistLabel.trim()
        if (!label) return
        setChecklist(prev => [...prev, { id: `c-${Date.now()}`, label, completed: false }])
        setNewChecklistLabel('')
    }
    const removeChecklistItem = (id: string) => setChecklist(prev => prev.filter(c => c.id !== id))

    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingPhoto(true)
        try {
            const blob = await compressImageToBlob(file, 2048, 0.85)
            const photoFile = new File([blob], `reminder-${Date.now()}.webp`, { type: blob.type })
            const url = await uploadImageToStorage(photoFile)
            setPhotoUrls(prev => [...prev, url])
        } catch (err) {
            console.error('Lỗi tải ảnh nhắc việc:', err)
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        setSaving(true)
        try {
            const ok = await onCreate({
                project_id: projectId, title,
                due_date: dueDate || null, assignee_id: assigneeId || null, created_by: createdBy,
                category: category.trim() || null, checklist, photo_urls: photoUrls,
                assignee_name: assigneeId ? null : (assigneeName.trim() || null),
            })
            if (ok) {
                setShowForm(false); resetForm()
            } else {
                alert('Lỗi tạo nhắc việc. Vui lòng thử lại.')
            }
        } finally {
            setSaving(false)
        }
    }

    const toggleItemDone = (r: ConstructionReminder, itemId: string) => {
        const updated = (r.checklist || []).map(c => c.id === itemId ? { ...c, completed: !c.completed } : c)
        onUpdate(r.id, { checklist: updated })
    }

    const pending = reminders.filter(r => r.status === 'pending')
    const done = reminders.filter(r => r.status === 'done')

    const ReminderRow = ({ r }: { r: ConstructionReminder }) => {
        const assignee = profiles.find(p => p.id === r.assignee_id)
        const checklistItems = r.checklist || []
        const doneCount = checklistItems.filter(c => c.completed).length
        const hasExtras = checklistItems.length > 0 || (r.photo_urls && r.photo_urls.length > 0)
        const expanded = expandedId === r.id
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-3">
                    <input type="checkbox" checked={r.status === 'done'} onChange={() => onToggleStatus(r.id, r.status === 'done' ? 'pending' : 'done')}
                        className="w-4 h-4 accent-[#7A1216] shrink-0" />
                    <div className="flex-1 min-w-0" onClick={() => hasExtras && setExpandedId(expanded ? null : r.id)}>
                        <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${r.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{r.title}</p>
                            {r.category && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0">{r.category}</span>}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap">
                            {r.due_date && <>Hạn: {r.due_date} </>}
                            {(assignee || r.assignee_name) && <>· {assignee?.full_name || r.assignee_name}</>}
                            {checklistItems.length > 0 && <>· Checklist {doneCount}/{checklistItems.length}</>}
                            {r.photo_urls && r.photo_urls.length > 0 && <>· {r.photo_urls.length} ảnh</>}
                        </p>
                    </div>
                    {hasExtras && (
                        <button onClick={() => setExpandedId(expanded ? null : r.id)} className="text-slate-500 hover:text-slate-700 shrink-0">
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                    {canWrite && (
                        <button onClick={() => onDelete(r.id)} className="text-slate-500 hover:text-red-600 shrink-0">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {expanded && hasExtras && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                        {checklistItems.length > 0 && (
                            <div className="space-y-1.5">
                                {checklistItems.map(item => (
                                    <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                        <input type="checkbox" checked={item.completed} onChange={() => toggleItemDone(r, item.id)}
                                            disabled={!canWrite} className="w-3.5 h-3.5 accent-indigo-500" />
                                        <span className={item.completed ? 'line-through text-slate-500' : ''}>{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {r.photo_urls && r.photo_urls.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {r.photo_urls.map((url, i) => (
                                    <img key={i} src={url} alt="Ảnh nhắc việc" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {canWrite && (
                <button onClick={() => setShowForm(v => !v)} className="px-4 py-2 bg-[#7A1216] hover:bg-[#5C0E11] text-white rounded-lg text-sm font-bold">
                    {showForm ? 'Đóng form' : '+ Thêm nhắc việc'}
                </button>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nội dung <span className="text-red-500">*</span></label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Gọi thợ điện xác nhận lịch"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hạng mục</label>
                        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="VD: Điện nước, Nội thất..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hạn</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Người phụ trách</label>
                            <select value={assigneeId} onChange={e => { setAssigneeId(e.target.value); if (e.target.value) setAssigneeName('') }}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500">
                                <option value="">-- Chọn --</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                            </select>
                            <input value={assigneeName}
                                onChange={e => { setAssigneeName(e.target.value); if (e.target.value) setAssigneeId('') }}
                                placeholder="Hoặc gõ tên tổ đội ngoài (VD: Mr Tiến, Đội sắt...)"
                                className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Checklist</label>
                        </div>
                        {checklist.length > 0 && (
                            <div className="space-y-1.5 mb-2">
                                {checklist.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
                                        <span className="flex-1 text-xs text-slate-700">{c.label}</span>
                                        <button type="button" onClick={() => removeChecklistItem(c.id)} className="text-slate-500 hover:text-red-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input value={newChecklistLabel} onChange={e => setNewChecklistLabel(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                                placeholder="+ Thêm mục checklist..."
                                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
                            <button type="button" onClick={addChecklistItem} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ảnh đính kèm</label>
                        <div className="space-y-2">
                            {photoUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {photoUrls.map((url, i) => (
                                        <div key={i} className="relative w-16 h-16">
                                            <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                                            <button type="button" onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute -top-1.5 -right-1.5 bg-white border border-slate-200 rounded-full shadow p-0.5">
                                                <X size={12} className="text-slate-600" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 cursor-pointer w-fit">
                                {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                {uploadingPhoto ? 'Đang tải...' : 'Thêm ảnh'}
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
                            </label>
                        </div>
                    </div>

                    <button type="submit" disabled={saving || !title.trim()}
                        className="w-full py-2.5 bg-[#7A1216] hover:bg-[#5C0E11] text-white rounded-lg text-sm font-bold disabled:opacity-50">
                        {saving ? 'Đang lưu...' : 'Lưu nhắc việc'}
                    </button>
                </form>
            )}

            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Bell size={12} /> Chưa xong ({pending.length})</p>
                <div className="space-y-2">
                    {pending.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Không có việc nào.</p>}
                    {pending.map(r => <ReminderRow key={r.id} r={r} />)}
                </div>
            </div>
            {done.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Đã xong ({done.length})</p>
                    <div className="space-y-2">
                        {done.map(r => <ReminderRow key={r.id} r={r} />)}
                    </div>
                </div>
            )}
        </div>
    )
}
