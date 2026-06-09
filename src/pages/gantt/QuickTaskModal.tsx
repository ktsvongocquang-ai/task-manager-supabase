import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../services/supabase'
import type { Task, Project } from '../../types'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    editingTask: Task | null
    projects: Project[]
    profiles: any[]
    currentUserProfile: any
}

const STATUS_OPTIONS = ['Chưa bắt đầu', 'Cần làm', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành', 'Tạm dừng']
const PRIORITY_OPTIONS = ['JUX', 'DQH']
const PHASE_OPTIONS = ['Concept', '3D / Phối cảnh', 'Triển khai 2D', 'Hoàn thiện hồ sơ', 'Khác']

export const QuickTaskModal: React.FC<Props> = ({
    isOpen, onClose, onSaved, editingTask, projects, profiles, currentUserProfile
}) => {
    const today = new Date().toISOString().split('T')[0]

    const [form, setForm] = useState({
        name: '', project_id: '', target: '', status: 'Cần làm', priority: 'DQH',
        start_date: today, due_date: today, assignee_id: '', supporter_id: '', description: ''
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        if (editingTask) {
            setForm({
                name: editingTask.name || '',
                project_id: editingTask.project_id || '',
                target: (editingTask as any).target || '',
                status: editingTask.status || 'Cần làm',
                priority: editingTask.priority || 'Trung bình',
                start_date: editingTask.start_date || today,
                due_date: editingTask.due_date || today,
                assignee_id: editingTask.assignee_id || currentUserProfile?.id || '',
                supporter_id: editingTask.supporter_id || '',
                description: editingTask.description || ''
            })
        } else {
            setForm({
                name: '', project_id: '', target: '', status: 'Cần làm', priority: 'DQH',
                start_date: today, due_date: today,
                assignee_id: currentUserProfile?.id || '', supporter_id: '', description: ''
            })
        }
    }, [isOpen, editingTask])

    const totalDays = form.start_date && form.due_date
        ? Math.max(1, Math.ceil((new Date(form.due_date).getTime() - new Date(form.start_date).getTime()) / 86400000) + 1)
        : 1

    const handleSave = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            const payload = {
                name: form.name.trim(),
                project_id: form.project_id || null,
                target: form.target || null,
                status: form.status,
                priority: form.priority,
                start_date: form.start_date || null,
                due_date: form.due_date || null,
                assignee_id: form.assignee_id || null,
                supporter_id: form.supporter_id || null,
                description: form.description || null,
            }
            if (editingTask) {
                await supabase.from('tasks').update(payload).eq('id', editingTask.id)
            } else {
                await supabase.from('tasks').insert({ ...payload, completion_pct: 0 })
            }
            onSaved()
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#222] rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-150">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {editingTask ? editingTask.task_code : 'Tạo nhiệm vụ'}
                        </span>
                        {/* Priority badge inline */}
                        <select
                            value={form.priority}
                            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border-0 focus:ring-0 cursor-pointer
                                ${form.priority === 'JUX' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                        >
                            {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#2a2a2a] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                    {/* Tên task */}
                    <input
                        autoFocus
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        placeholder="Tên nhiệm vụ..."
                        className="w-full text-base font-semibold text-slate-100 placeholder:text-slate-300 border-0 border-b border-[#333] focus:border-indigo-400 focus:ring-0 pb-1 px-0"
                    />

                    {/* Dự án + Giai đoạn */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Dự án</label>
                            <select
                                value={form.project_id}
                                onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                                className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200"
                            >
                                <option value="">-- Chọn dự án --</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Giai đoạn</label>
                            <select
                                value={form.target}
                                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                                className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200"
                            >
                                <option value="">-- Giai đoạn --</option>
                                {PHASE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Trạng thái + Số ngày */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Trạng thái</label>
                            <select
                                value={form.status}
                                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200"
                            >
                                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Số ngày</label>
                            <div className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 text-indigo-600 font-bold bg-[#1c1c1c]">
                                {totalDays} ngày
                            </div>
                        </div>
                    </div>

                    {/* Ngày bắt đầu + Hạn chót */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Bắt đầu</label>
                            <input type="date" value={form.start_date}
                                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Hạn chót</label>
                            <input type="date" value={form.due_date}
                                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200" />
                        </div>
                    </div>

                    {/* Chủ trì + Thực hiện */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Chủ trì</label>
                            <select value={form.assignee_id}
                                onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}
                                className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200">
                                <option value="">Chọn người...</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Thực hiện</label>
                            <select value={form.supporter_id}
                                onChange={e => setForm(f => ({ ...f, supporter_id: e.target.value }))}
                                className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200">
                                <option value="">Chọn người...</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={2}
                            placeholder="Thêm mô tả..."
                            className="w-full text-sm border border-[#333] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-slate-200 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#333]">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={saving || !form.name.trim()}
                        className="px-5 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors">
                        {saving ? 'Đang lưu...' : 'Lưu lại'}
                    </button>
                </div>
            </div>
        </div>
    )
}
