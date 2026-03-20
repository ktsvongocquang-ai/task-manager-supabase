import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import type { Project, ShootingMilestone, DailyLog } from '../../../types';
import { format, parseISO, addDays } from 'date-fns';
import { X, Calendar, Plus, Trash2, Save, Loader2, Video, FileText, Camera } from 'lucide-react';

interface TimelineUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onSaved: () => void;
}

export const TimelineUpdateModal: React.FC<TimelineUpdateModalProps> = ({
    isOpen,
    onClose,
    project,
    onSaved
}) => {
    const [form, setForm] = useState({
        name: '',
        address: '',
        supervisor_phone: '',
        project_code: '',
        actual_start_date: '',
        design_days: 0,
        rough_construction_days: 0,
        finishing_days: 0,
        interior_days: 0,
        handover_date: ''
    });

    const [milestones, setMilestones] = useState<ShootingMilestone[]>([]);
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [projectTasks, setProjectTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // New daily log form
    const [newLogContent, setNewLogContent] = useState('');
    const [newLogMedia, setNewLogMedia] = useState('');

    // New milestone form
    const [newMsDate, setNewMsDate] = useState(new Date().toISOString().split('T')[0]);
    const [newMsTaskId, setNewMsTaskId] = useState('');

    useEffect(() => {
        if (isOpen && project) {
            setForm({
                name: project.name || '',
                address: project.address || '',
                supervisor_phone: project.supervisor_phone || '',
                project_code: project.project_code || '',
                actual_start_date: project.actual_start_date || '',
                design_days: project.design_days || 0,
                rough_construction_days: project.rough_construction_days || 0,
                finishing_days: project.finishing_days || 0,
                interior_days: project.interior_days || 0,
                handover_date: project.handover_date || ''
            });
            fetchRelatedData();
        }
    }, [isOpen, project]);

    const fetchRelatedData = async () => {
        if (!project.id) return;
        setIsLoading(true);
        try {
            const { data: msData } = await supabase
                .from('marketing_shooting_milestones')
                .select('*')
                .eq('project_id', project.id)
                .order('milestone_date', { ascending: true });
            if (msData) setMilestones(msData);

            const { data: logsData } = await supabase
                .from('marketing_daily_logs')
                .select('*')
                .eq('project_id', project.id)
                .order('log_date', { ascending: false });
            if (logsData) setDailyLogs(logsData);

            const { data: tasksData } = await supabase
                .from('marketing_tasks')
                .select('id, name')
                .eq('project_id', project.id);
            if (tasksData) setProjectTasks(tasksData);
        } catch (e) {
            console.error('Error fetching timeline data', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate handover date automatically
    useEffect(() => {
        if (form.actual_start_date && (form.design_days || form.rough_construction_days || form.finishing_days || form.interior_days)) {
            const startDate = parseISO(form.actual_start_date);
            const totalDays = Number(form.design_days) + Number(form.rough_construction_days) + Number(form.finishing_days) + Number(form.interior_days);
            if (totalDays > 0) {
                const calculatedEnd = addDays(startDate, totalDays);
                const endDateStr = format(calculatedEnd, 'yyyy-MM-dd');
                // Only auto-update if they are different and user hasn't manually overridden it heavily (or just overwrite for preview)
                setForm(prev => ({ ...prev, handover_date: endDateStr }));
            }
        }
    }, [form.actual_start_date, form.design_days, form.rough_construction_days, form.finishing_days, form.interior_days]);

    const handleSaveTimeline = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('marketing_projects')
                .update({
                    project_code: form.project_code,
                    actual_start_date: form.actual_start_date || null,
                    design_days: Number(form.design_days),
                    rough_construction_days: Number(form.rough_construction_days),
                    finishing_days: Number(form.finishing_days),
                    interior_days: Number(form.interior_days),
                    handover_date: form.handover_date || null,
                    status: (form.handover_date && new Date(form.handover_date) <= new Date()) ? 'Đã bàn giao' : project.status
                })
                .eq('id', project.id);
                
            if (error) throw error;
            onSaved();
            alert('Lưu tiến độ thành công!');
        } catch (e) {
            console.error(e);
            alert('Lỗi lưu tiến độ.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMilestone = async () => {
        if (!newMsTaskId) {
            alert("Vui lòng chọn Task nội dung trước khi thêm mốc quay!");
            return;
        }
        setIsLoading(true);
        const selectedTask = projectTasks.find(t => t.id === newMsTaskId);
        const newMs = {
            project_id: project.id,
            milestone_date: newMsDate,
            content: selectedTask ? selectedTask.name : 'Nội dung quay mới',
            task_id: newMsTaskId,
            status: 'Chờ quay'
        };
        try {
            const { data, error } = await supabase.from('marketing_shooting_milestones').insert(newMs).select().single();
            if (error) throw error;
            if (data) {
                setMilestones(prev => [...prev, data]);
                setNewMsTaskId('');
                // Sync start_date to task natively
                await supabase.from('marketing_tasks').update({ start_date: newMsDate }).eq('id', newMsTaskId);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi thêm mốc quay.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateMilestone = async (id: string, field: string, value: string) => {
        if (field === 'task_id') {
            const selectedTask = projectTasks.find(t => t.id === value);
            const contentName = selectedTask ? selectedTask.name : 'Nội dung quay mới';
            setMilestones(prev => prev.map(m => m.id === id ? { ...m, task_id: value, content: contentName } : m));
            try {
                await supabase.from('marketing_shooting_milestones').update({ task_id: value || null, content: contentName }).eq('id', id);
                const ms = milestones.find(m => m.id === id);
                if (ms && value) {
                    await supabase.from('marketing_tasks').update({ start_date: ms.milestone_date }).eq('id', value);
                }
            } catch (e) {
                console.error(e);
            }
        } else if (field === 'milestone_date') {
            setMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
            try {
                await supabase.from('marketing_shooting_milestones').update({ [field]: value }).eq('id', id);
                const ms = milestones.find(m => m.id === id);
                if (ms && ms.task_id) {
                    await supabase.from('marketing_tasks').update({ start_date: value }).eq('id', ms.task_id);
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            setMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
            try {
                await supabase.from('marketing_shooting_milestones').update({ [field]: value }).eq('id', id);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleDeleteMilestone = async (id: string) => {
        if (!confirm('Xoá mốc quay này?')) return;
        setMilestones(prev => prev.filter(m => m.id !== id));
        try {
            await supabase.from('marketing_shooting_milestones').delete().eq('id', id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddLog = async () => {
        if (!newLogContent.trim()) return;
        setIsLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const userId = session.data.session?.user.id;
            
            const newLog = {
                project_id: project.id,
                log_date: new Date().toISOString().split('T')[0],
                content: newLogContent,
                media_link: newLogMedia,
                user_id: userId
            };

            const { data, error } = await supabase.from('marketing_daily_logs').insert(newLog).select().single();
            if (error) throw error;
            if (data) {
                setDailyLogs(prev => [data, ...prev]);
                setNewLogContent('');
                setNewLogMedia('');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi thêm nhật ký');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 shrink-0">
                    <div className="flex-1 mr-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <Calendar className="text-indigo-500" />
                            Cập nhật Dự án & Mốc quay
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mã Dự án</label>
                                <input 
                                    type="text" 
                                    value={form.project_code} 
                                    onChange={e => setForm({...form, project_code: e.target.value})}
                                    className="w-full bg-slate-50 border border-gray-200 rounded-lg text-sm font-mono font-bold p-2 focus:ring-1 focus:ring-indigo-500 text-indigo-600"
                                    placeholder="DA001"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tên Dự án</label>
                                <input 
                                    type="text" 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg text-sm font-bold p-2 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Tên dự án..."
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Địa chỉ</label>
                                <input 
                                    type="text" 
                                    value={form.address} 
                                    onChange={e => setForm({...form, address: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg text-sm font-medium p-2 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Địa chỉ công trình..."
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">SĐT Giám sát</label>
                                <input 
                                    type="text" 
                                    value={form.supervisor_phone} 
                                    onChange={e => setForm({...form, supervisor_phone: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg text-sm font-medium p-2 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Số điện thoại giám sát..."
                                />
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar flex flex-col md:flex-row gap-8">
                    {/* Left Column: Timeline Inputs -> Width 50% */}
                    <div className="w-full md:w-1/2 flex flex-col gap-6">
                        
                        {/* Timeline Settings */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Thiết lập thời gian (Ngày)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Ngày Khởi công (Thực tế)</label>
                                    <input 
                                        type="date" 
                                        value={form.actual_start_date} 
                                        onChange={e => setForm({...form, actual_start_date: e.target.value})}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl"></div>
                                        <label className="block text-xs font-bold text-indigo-700 mb-1 pl-2">Thiết kế</label>
                                        <div className="flex items-center gap-2 pl-2">
                                            <input type="number" min="0" value={form.design_days} onChange={e => setForm({...form, design_days: Number(e.target.value)})} className="w-full bg-white border-none rounded py-1 px-2 text-sm font-bold shadow-sm focus:ring-1 focus:ring-indigo-500" />
                                            <span className="text-xs text-indigo-400 font-medium">ngày</span>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-xl"></div>
                                        <label className="block text-xs font-bold text-orange-700 mb-1 pl-2">Thi công Thô</label>
                                        <div className="flex items-center gap-2 pl-2">
                                            <input type="number" min="0" value={form.rough_construction_days} onChange={e => setForm({...form, rough_construction_days: Number(e.target.value)})} className="w-full bg-white border-none rounded py-1 px-2 text-sm font-bold shadow-sm focus:ring-1 focus:ring-orange-500" />
                                            <span className="text-xs text-orange-400 font-medium">ngày</span>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>
                                        <label className="block text-xs font-bold text-blue-700 mb-1 pl-2">Hoàn thiện</label>
                                        <div className="flex items-center gap-2 pl-2">
                                            <input type="number" min="0" value={form.finishing_days} onChange={e => setForm({...form, finishing_days: Number(e.target.value)})} className="w-full bg-white border-none rounded py-1 px-2 text-sm font-bold shadow-sm focus:ring-1 focus:ring-blue-500" />
                                            <span className="text-xs text-blue-400 font-medium">ngày</span>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl"></div>
                                        <label className="block text-xs font-bold text-emerald-700 mb-1 pl-2">Thi công Nội thất</label>
                                        <div className="flex items-center gap-2 pl-2">
                                            <input type="number" min="0" value={form.interior_days} onChange={e => setForm({...form, interior_days: Number(e.target.value)})} className="w-full bg-white border-none rounded py-1 px-2 text-sm font-bold shadow-sm focus:ring-1 focus:ring-emerald-500" />
                                            <span className="text-xs text-emerald-400 font-medium">ngày</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Ngày Bàn giao (Dự kiến / Thực tế)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="date" 
                                            value={form.handover_date} 
                                            onChange={e => setForm({...form, handover_date: e.target.value})}
                                            className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-sm font-bold p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                        <button 
                                            onClick={handleSaveTimeline}
                                            disabled={isLoading}
                                            className="bg-gray-900 text-white p-2.5 rounded-lg hover:bg-black transition-colors flex items-center gap-1.5 shrink-0 px-4 font-bold text-sm"
                                        >
                                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            Lưu tiến độ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shooting Milestones */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                                    <Video size={16} className="text-rose-500" />
                                    Mốc quay Phim (Marketing)
                                </h3>
                            </div>

                            <div className="bg-rose-50/50 border border-rose-200 p-3 rounded-xl mb-4 shadow-sm">
                                <div className="text-[10px] sm:text-xs font-bold text-rose-800 mb-2 uppercase flex items-center gap-1.5"><Plus size={14}/> Thêm mốc quay mới</div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                        type="date" 
                                        value={newMsDate}
                                        onChange={e => setNewMsDate(e.target.value)}
                                        className="sm:w-32 w-full bg-white border border-gray-200 text-xs font-bold text-gray-700 p-2 focus:ring-1 focus:ring-rose-400 rounded-lg"
                                    />
                                    <select
                                        value={newMsTaskId}
                                        onChange={e => setNewMsTaskId(e.target.value)}
                                        className="flex-1 bg-white border border-gray-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-rose-400 font-bold text-slate-700"
                                    >
                                        <option value="" disabled className="text-gray-400">--- Chọn Task để gắn lịch ---</option>
                                        {projectTasks.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={handleAddMilestone} disabled={!newMsTaskId || isLoading} className="bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50 shrink-0 transition-colors">
                                        Thêm
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 custom-scrollbar space-y-3 pr-2 min-h-[150px]">
                                {milestones.length === 0 ? (
                                    <div className="text-center text-gray-400 text-xs italic py-6">Chưa có mốc quay nào.</div>
                                ) : (
                                    milestones.map(ms => (
                                        <div key={ms.id} className="bg-white border border-gray-200 p-3 rounded-xl hover:border-rose-300 transition-colors shadow-sm group">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="date" 
                                                    value={ms.milestone_date}
                                                    onChange={e => handleUpdateMilestone(ms.id, 'milestone_date', e.target.value)}
                                                    className="w-32 bg-transparent border-none text-xs font-bold text-gray-700 p-0 focus:ring-0"
                                                />
                                                <select 
                                                    value={ms.status}
                                                    onChange={e => handleUpdateMilestone(ms.id, 'status', e.target.value)}
                                                    className={`border-none text-[10px] font-bold p-0 focus:ring-0 rounded-md cursor-pointer ${ms.status === 'Chờ quay' ? 'text-orange-500' : ms.status === 'Đã quay' ? 'text-emerald-500' : 'text-gray-400'}`}
                                                >
                                                    <option value="Chờ quay">Chờ quay</option>
                                                    <option value="Đã quay">Đã quay</option>
                                                    <option value="Đã huỷ">Đã huỷ</option>
                                                </select>
                                                <div className="flex-1"></div>
                                                <button onClick={() => handleDeleteMilestone(ms.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <select
                                                value={ms.task_id || ''}
                                                onChange={e => handleUpdateMilestone(ms.id, 'task_id', e.target.value)}
                                                className="w-full mt-2 bg-white border border-rose-200 rounded text-sm p-1.5 focus:bg-rose-50 focus:ring-1 focus:ring-rose-400 font-medium text-slate-700"
                                            >
                                                <option value="" disabled className="text-gray-400">--- Gắn với nội dung Task ---</option>
                                                {projectTasks.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Daily Logs -> Width 50% */}
                    <div className="w-full md:w-1/2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                                <FileText size={16} className="text-blue-500" />
                                Nhật ký Công trình
                            </h3>
                        </div>
                        
                        {/* Add Log Form */}
                        <div className="p-4 border-b border-gray-100 bg-white">
                            <textarea 
                                value={newLogContent}
                                onChange={e => setNewLogContent(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors custom-scrollbar"
                                placeholder="Cập nhật tình hình hôm nay..."
                                rows={2}
                            />
                            <div className="flex gap-2 mt-2">
                                <input 
                                    type="text" 
                                    value={newLogMedia}
                                    onChange={e => setNewLogMedia(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:bg-white focus:ring-1 focus:ring-blue-400"
                                    placeholder="Link ảnh/video (Drive/Zalo)..."
                                />
                                <button 
                                    onClick={handleAddLog}
                                    disabled={!newLogContent.trim() || isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                                >
                                    Đăng
                                </button>
                            </div>
                        </div>

                        {/* Logs List - Vertical Timeline */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 custom-scrollbar relative">
                            {dailyLogs.length === 0 ? (
                                <div className="text-center text-gray-400 text-xs italic py-10">Chưa có nhật ký nào.</div>
                            ) : (
                                <div className="space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                    {dailyLogs.map(log => (
                                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-2 md:ml-0">
                                            </div>
                                            
                                            {/* Card */}
                                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl shadow-sm bg-white border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                                        {format(parseISO(log.log_date), 'dd/MM/yyyy')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{log.content}</p>
                                                {log.media_link && (
                                                    <a href={log.media_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                                                        <Camera size={12} /> Xem tư liệu
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
