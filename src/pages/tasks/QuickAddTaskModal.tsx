import React, { useState, useEffect } from 'react'
import { X, Loader2, LayoutTemplate } from 'lucide-react'
import { supabase } from '../../services/supabase'
import type { Project } from '../../types'
import { format, parseISO, addDays, differenceInDays } from 'date-fns'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    initialData: {
        task_code: string
        project_id: string
        start_date?: string
        due_date?: string
        assignee_id?: string
    }
    projects: Project[]
    profiles: any[]
    currentUserProfile: any
}

export const QuickAddTaskModal = ({
    isOpen,
    onClose,
    onSaved,
    initialData,
    projects,
    profiles,
    currentUserProfile
}: Props) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        task_code: '',
        project_id: '',
        target: '',
        status: 'Cần làm',
        start_date: today,
        due_date: today,
        days: 1,
        assignee_id: '',
        supporter_id: '',
        description: ''
    })

    useEffect(() => {
        if (isOpen) {
            const st = initialData.start_date || today
            const ed = initialData.due_date || today
            const days = Math.max(1, differenceInDays(new Date(ed), new Date(st)) + 1)
            setForm({
                name: '',
                task_code: initialData.task_code,
                project_id: initialData.project_id,
                target: '',
                status: 'Cần làm',
                start_date: st,
                due_date: ed,
                days,
                assignee_id: initialData.assignee_id || currentUserProfile?.id || '',
                supporter_id: '',
                description: ''
            })
        }
    }, [isOpen, initialData, currentUserProfile, today])

    if (!isOpen) return null

    const handleDaysChange = (val: string) => {
        const d = parseInt(val)
        if (isNaN(d) || d < 1) return
        if (form.start_date) {
            const newEnd = format(addDays(new Date(form.start_date), d - 1), 'yyyy-MM-dd')
            setForm(prev => ({ ...prev, days: d, due_date: newEnd }))
        } else {
            setForm(prev => ({ ...prev, days: d }))
        }
    }

    const handleDateChange = (field: 'start_date' | 'due_date', val: string) => {
        setForm(prev => {
            const next = { ...prev, [field]: val }
            if (next.start_date && next.due_date) {
                const d = differenceInDays(new Date(next.due_date), new Date(next.start_date)) + 1
                next.days = Math.max(1, d)
            }
            return next
        })
    }

    const handleSave = async () => {
        if (!form.name.trim()) return alert('Vui lòng nhập tên công việc')
        if (!form.project_id) return alert('Vui lòng chọn dự án')
        
        setLoading(true)
        try {
            let finalTaskCode = form.task_code
            const taskData = {
                name: form.name.trim(),
                task_code: finalTaskCode,
                project_id: form.project_id,
                target: form.target || null,
                status: form.status,
                start_date: form.start_date || null,
                due_date: form.due_date || null,
                assignee_id: form.assignee_id || null,
                supporter_id: form.supporter_id || null,
                description: form.description || null,
                priority: 'DQH',
                completion_pct: 0
            }

            let result = await supabase.from('tasks').insert([taskData])
            
            // Retry with unique suffix if duplicate task_code
            if (result.error?.message?.includes('duplicate key') && result.error.message?.includes('tasks_task_code_key')) {
                for (let retry = 1; retry <= 5; retry++) {
                    const suffix = String(Date.now()).slice(-4)
                    taskData.task_code = `${form.task_code}-${suffix}`
                    result = await supabase.from('tasks').insert([taskData])
                    if (!result.error) break
                    if (!result.error.message?.includes('tasks_task_code_key')) break
                }
            }

            if (result.error) throw result.error
            onSaved()
            onClose()
        } catch (error: any) {
            console.error('Error saving task:', error)
            alert('Có lỗi xảy ra: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <LayoutTemplate size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <input 
                                type="text"
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="Tên công việc..."
                                className="w-full text-lg font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
                                autoFocus
                            />
                            <div className="text-xs text-slate-400 font-medium mt-0.5">{form.task_code || 'Mã công việc tự tạo'}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 overflow-y-auto max-h-[80vh]">
                    <div className="flex flex-col gap-3">
                        {/* Row 1: Dự án */}
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Dự án</label>
                            <select 
                                value={form.project_id}
                                onChange={e => setForm({...form, project_id: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="">Chọn dự án...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Hidden Target field */}
                        <div className="hidden">
                            <select value={form.target} onChange={e => setForm({...form, target: e.target.value})}>
                                <option value="">Chọn...</option>
                            </select>
                        </div>

                        {/* Row 2: Trạng thái & Số ngày */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Trạng thái</label>
                                <select 
                                    value={form.status}
                                    onChange={e => setForm({...form, status: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    {form.status === 'Chưa bắt đầu' && <option value="Chưa bắt đầu">Chưa bắt đầu</option>}
                                    {form.status === 'Đang thực hiện' && <option value="Đang thực hiện">Đang thực hiện</option>}
                                    <option value="Cần làm">Cần làm</option>
                                    <option value="Chờ duyệt">Chờ duyệt</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Số ngày</label>
                                <input 
                                    type="number"
                                    min="1"
                                    value={form.days}
                                    onChange={e => handleDaysChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Row 3: Bắt đầu & Hạn chót */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Bắt đầu</label>
                                <input 
                                    type="date"
                                    value={form.start_date}
                                    onChange={e => handleDateChange('start_date', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Hạn chót</label>
                                <input 
                                    type="date"
                                    value={form.due_date}
                                    onChange={e => handleDateChange('due_date', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Row 4: Chủ trì & Thực hiện */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Chủ trì</label>
                                <select 
                                    value={form.assignee_id}
                                    onChange={e => setForm({...form, assignee_id: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="">Chọn...</option>
                                    {profiles.filter(p => ['Admin', 'Quản lý thiết kế', 'Thiết kế'].includes(p.role)).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Thực hiện</label>
                                <select 
                                    value={form.supporter_id}
                                    onChange={e => setForm({...form, supporter_id: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="">Chọn...</option>
                                    {profiles.filter(p => ['Admin', 'Quản lý thiết kế', 'Thiết kế'].includes(p.role)).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 5: Mô tả */}
                        <div>
                            <textarea 
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})}
                                placeholder="Thêm mô tả..."
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Lưu lại
                    </button>
                </div>
            </div>
        </div>
    )
}
