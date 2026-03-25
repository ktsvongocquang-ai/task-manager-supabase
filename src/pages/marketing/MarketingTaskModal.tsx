import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { X, Plus, Trash2, CheckCircle2, Folder, AlignLeft, Link as LinkIcon, ListTodo, MessageSquare, ExternalLink, GripVertical, Mic, MicOff, Sparkles, Loader2, Archive } from 'lucide-react'
import { logActivity } from '../../services/activity';
import { createNotification } from '../../services/notifications';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { CommentSection } from '../../components/chat/CommentSection';
import { format, parseISO } from 'date-fns';

interface AddEditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingTask: Task | null;
    initialData?: {
        task_code: string;
        project_id: string;
    };
    projects: Project[];
    profiles: any[];
    currentUserProfile: any;
    generateNextTaskCode?: (projectId: string) => string;
}


const defaultSections = [
    { id: 'mo_dau', label: 'Mở đầu', badge_color: 'bg-[#E1F5EE] text-[#085041]', description: 'Hook', kich_ban: '', source_clips: [], anh_minh_hoa: [], chu_thich: '' },
    { id: 'van_de', label: 'Vấn đề', badge_color: 'bg-[#FCEBEB] text-[#791F1F]', description: 'Pain point', kich_ban: '', source_clips: [], anh_minh_hoa: [], chu_thich: '' },
    { id: 'giai_phap', label: 'Giải pháp', badge_color: 'bg-[#E6F1FB] text-[#0C447C]', description: 'Case thực tế', kich_ban: '', source_clips: [], anh_minh_hoa: [], chu_thich: '' },
    { id: 'cta', label: 'CTA', badge_color: 'bg-[#FAEEDA] text-[#633806]', description: 'Follow', kich_ban: '', source_clips: [], anh_minh_hoa: [], chu_thich: '' }
];

const MarketingSectionTable = ({ sections, onChange }: { sections: any[], onChange: (s: any[]) => void }) => {
    
    // Auto-resize textarea
    const autoResize = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    };

    const currentSections = (sections && sections.length > 0) ? sections : defaultSections;

    return (
        <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-[#f8fafc] text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shadow-sm">
                    <tr>
                        <th className="p-3 text-center border-r border-slate-200" style={{ width: '5%' }}>STT</th>
                        <th className="p-3 border-r border-slate-200" style={{ width: '15%' }}>Nội dung</th>
                        <th className="p-3 border-r border-slate-200" style={{ width: '40%' }}>Kịch bản</th>
                        <th className="p-3 border-r border-slate-200" style={{ width: '20%' }}>Source clip</th>
                        <th className="p-3" style={{ width: '20%' }}>Chú thích & minh họa</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {currentSections.map((sec: any, index: number) => (
                        <tr key={sec.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 align-top text-center text-slate-400 font-bold border-r border-slate-100">{index + 1}</td>
                            <td className="p-4 align-top border-r border-slate-100">
                                <div className="flex flex-col items-start gap-1">
                                    <div className={`${sec.badge_color} px-2 py-0.5 rounded text-[10px] font-bold`}>
                                        {sec.label}
                                    </div>
                                    <div className="text-slate-800 font-semibold text-xs mt-1">{sec.description}</div>
                                </div>
                            </td>
                            <td className="p-3 align-top border-r border-slate-100 relative group/kb border-transparent hover:border-indigo-100 hover:bg-white rounded transition-colors focus-within:bg-indigo-50/20 focus-within:border-indigo-200 border">
                                <textarea 
                                    className="w-full bg-transparent border-none resize-none p-1 text-slate-700 text-[13px] leading-relaxed focus:ring-0 focus:outline-none min-h-[68px]" 
                                    placeholder="Viết kịch bản..."
                                    value={sec.kich_ban || ''}
                                    onChange={(e) => {
                                        const newS = [...currentSections];
                                        newS[index] = {...newS[index], kich_ban: e.target.value};
                                        onChange(newS);
                                    }}
                                    onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                                    // Trigger auto-resize on mount
                                    ref={(el) => { if(el) autoResize(el); }}
                                />
                            </td>
                            <td className="p-3 align-top border-r border-slate-100">
                                <div className="flex flex-col gap-1.5">
                                    {(sec.source_clips || []).map((clip: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1.5 p-1.5 border border-slate-200 rounded-md bg-white text-[11px] text-slate-600 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] shrink-0"></div>
                                            <span className="truncate flex-1" title={clip}>{clip}</span>
                                            <button 
                                                className="text-slate-400 hover:text-[#E24B4A] ml-auto transition-colors"
                                                onClick={() => {
                                                    const newS = [...currentSections];
                                                    newS[index].source_clips = newS[index].source_clips.filter((_: any, idx: number) => idx !== i);
                                                    onChange(newS);
                                                }}
                                            ><X size={10} /></button>
                                        </div>
                                    ))}
                                    <button 
                                        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 rounded-md p-1.5 text-center cursor-pointer transition-colors hover:bg-slate-50"
                                        onClick={() => {
                                            const name = prompt('Nhập tên file Video/Clip:');
                                            if (name) {
                                                const newS = [...currentSections];
                                                newS[index].source_clips = [...(newS[index].source_clips||[]), name];
                                                onChange(newS);
                                            }
                                        }}
                                    >+ Thêm clip</button>
                                </div>
                            </td>
                            <td className="p-0 align-top">
                                <div className="flex flex-col h-full min-h-[100px]">
                                    <textarea 
                                        className="w-full bg-transparent border-none resize-none p-4 pb-2 text-slate-600 text-[11px] leading-relaxed focus:bg-indigo-50/10 focus:ring-0 focus:outline-none min-h-[68px] transition-colors" 
                                        placeholder="Ghi chú dựng video..."
                                        value={sec.chu_thich || ''}
                                        onChange={(e) => {
                                            const newS = [...currentSections];
                                            newS[index] = {...newS[index], chu_thich: e.target.value};
                                            onChange(newS);
                                        }}
                                        onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                                        ref={(el) => { if(el) autoResize(el); }}
                                    />
                                    <div className="h-[0.5px] bg-slate-200 mx-3"></div>
                                    <div className="p-3 flex flex-col gap-1.5">
                                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Ảnh minh họa</div>
                                        {(sec.anh_minh_hoa || []).map((anh: string, i: number) => (
                                            <div key={i} className="flex items-center gap-1.5 p-1.5 border border-slate-200 rounded-md bg-white text-[11px] text-slate-600 shadow-sm">
                                                <span className="truncate flex-1" title={anh}>{anh}</span>
                                                <button 
                                                    className="text-slate-400 hover:text-red-500 ml-auto transition-colors"
                                                    onClick={() => {
                                                        const newS = [...currentSections];
                                                        newS[index].anh_minh_hoa = newS[index].anh_minh_hoa.filter((_: any, idx: number) => idx !== i);
                                                        onChange(newS);
                                                    }}
                                                ><X size={10} /></button>
                                            </div>
                                        ))}
                                        <button 
                                            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 rounded-md p-1.5 text-center cursor-pointer transition-colors hover:bg-slate-50"
                                            onClick={() => {
                                                const name = prompt('Nhập tên hoặc link ảnh minh họa:');
                                                if (name) {
                                                    const newS = [...currentSections];
                                                    newS[index].anh_minh_hoa = [...(newS[index].anh_minh_hoa||[]), name];
                                                    onChange(newS);
                                                }
                                            }}
                                        >+ Thêm ảnh</button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export const MarketingTaskModal: React.FC<AddEditTaskModalProps> = ({
    isOpen,
    onClose,
    onSaved,
    editingTask,
    initialData,
    projects,
    profiles,
    currentUserProfile,
    generateNextTaskCode
}) => {
    const [form, setForm] = useState({
        task_code: '', project_id: '', name: '', description: '', assignee_id: [] as string[],
        supporter_id: '', status: 'IDEA', priority: 'Trung bình', start_date: '', due_date: '',
        result_links: '', notes: '', parent_id: '', format: '', platform: '', category: '', target: '',
        output: '',
        views: '', interactions: '', shares: '', saves: '',
        sections: [] as any[]
    });

    

    // removed unused phases state
    const [subTasks, setSubTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'links'>('subtasks');
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);

    // Deep link state for subtasks
    const [drilledSubtask, setDrilledSubtask] = useState<Task | null>(null);

    // AI & Speech states
    const [isListening, setIsListening] = useState<'name' | 'description' | 'subtask' | 'notes' | 'result_links' | 'output' | 'category' | null>(null);
    const [isRefining, setIsRefining] = useState<'name' | 'description' | 'notes' | 'result_links' | 'output' | 'category' | null>(null);

    const handleSpeechToText = (field: 'name' | 'description' | 'subtask' | 'notes' | 'result_links' | 'output' | 'category') => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy thử dùng Chrome hoặc Safari mới nhất.");
            return;
        }

        if (isListening) {
            // Already listening, don't start another
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.interimResults = false; // Keep it simple for reliable results
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        let silenceTimer: any;

        const stopRecognition = () => {
            clearTimeout(silenceTimer);
            try {
                recognition.stop();
            } catch (e) { }
            setIsListening(null);
        };

        recognition.onstart = () => {
            setIsListening(field);
            // Safety timeout: stop after 10 seconds of no result
            silenceTimer = setTimeout(() => {
                stopRecognition();
            }, 10000);
        };

        recognition.onresult = (event: any) => {
            clearTimeout(silenceTimer);
            const transcript = event.results[0][0].transcript;

            if (field === 'subtask') {
                setNewSubtaskName(prev => prev ? `${prev} ${transcript}` : transcript);
            } else {
                setForm(prev => ({
                    ...prev,
                    [field]: prev[field as keyof typeof prev] ? `${prev[field as keyof typeof prev]} ${transcript}` : transcript
                }));
            }
            stopRecognition();
        };

        recognition.onerror = (event: any) => {
            clearTimeout(silenceTimer);
            if (event.error === 'not-allowed') {
                alert("Không có quyền truy cập Micro. Hãy kiểm tra cài đặt trình duyệt/điện thoại.");
            } else if (event.error === 'service-not-allowed') {
                alert("Công cụ giọng nói bị chặn (có thể do Siri đang bật hoặc hết hạn mức).");
            } else {
                console.warn('Speech recognition error:', event.error);
                // We ignore 'no-speech' and others to avoid annoying popups
            }
            setIsListening(null);
        };

        recognition.onend = () => {
            setIsListening(null);
            clearTimeout(silenceTimer);
        };

        try {
            recognition.start();
        } catch (err) {
            console.error('Failed to start recognition:', err);
            setIsListening(null);
        }
    };

    const handleAIRefine = async (field: 'name' | 'description' | 'notes' | 'result_links' | 'output' | 'category') => {
        const textToRefine = form[field as keyof typeof form];
        if (!textToRefine) {
            alert("Vui lòng nhập nội dung trước khi tinh chỉnh.");
            return;
        }

        setIsRefining(field);
        try {
            const res = await fetch('/api/refine-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToRefine, field })
            });

            if (!res.ok) throw new Error('Failed to refine text');

            const data = await res.json();
            if (data.refinedText) {
                setForm(prev => ({ ...prev, [field]: data.refinedText }));
            }
        } catch (error) {
            console.error('AI Refine error:', error);
            alert("Lỗi khi AI tinh chỉnh nội dung.");
        } finally {
            setIsRefining(null);
        }
    };

    
    

    const handleOpenDeepLink = async (subtaskId: string) => {
        const { data } = await supabase.from('marketing_tasks').select('*').eq('id', subtaskId).single();
        if (data) {
            setDrilledSubtask(data as Task);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                const today = new Date().toISOString().split('T')[0];
                setForm({
                    task_code: editingTask.task_code || initialData?.task_code || '',
                    project_id: editingTask.project_id || initialData?.project_id || '',
                    name: editingTask.name || '',
                    description: editingTask.description || '',
                    assignee_id: Array.isArray(editingTask.assignee_id) ? editingTask.assignee_id : (editingTask.assignee_id ? [editingTask.assignee_id] : (currentUserProfile?.id ? [currentUserProfile.id] : [])),
                    supporter_id: editingTask.supporter_id || '',
                    status: editingTask.status || 'IDEA',
                    priority: editingTask.priority || 'Trung bình',
                    start_date: editingTask.start_date || today,
                    due_date: editingTask.due_date || today,
                    result_links: editingTask.result_links || '',
                    output: editingTask.output || '',
                    notes: editingTask.notes || '',
                    parent_id: editingTask.parent_id || '',
                    format: editingTask.format || '',
                    platform: editingTask.platform || '',
                    category: editingTask.category || '',
                    target: editingTask.target || '',
                    views: editingTask.views?.toString() || '',
                    interactions: editingTask.interactions?.toString() || '',
                    shares: editingTask.shares?.toString() || '',
                    saves: editingTask.saves?.toString() || '',
                    sections: editingTask.sections || []
                });

                // Fetch actual subtasks from Supabase
                const fetchSubtasks = async () => {
                    if (!editingTask.id) return;
                    setIsLoadingSubtasks(true);
                    try {
                        const { data, error } = await supabase
                            .from('marketing_tasks')
                            .select('*')
                            .eq('parent_id', editingTask.id)
                            .order('task_code', { ascending: true });
                        if (!error && data) {
                            setSubTasks(data as Task[]);
                        }
                    } catch (e) {
                        console.error('Error fetching subtasks:', e);
                    } finally {
                        setIsLoadingSubtasks(false);
                    }
                };
                fetchSubtasks();

            } else {
                const today = new Date().toISOString().split('T')[0];

                setForm({
                    task_code: initialData?.task_code || '',
                    project_id: initialData?.project_id || '',
                    name: '',
                    description: '',
                    assignee_id: currentUserProfile?.id ? [currentUserProfile.id] : [],
                    supporter_id: '',
                    status: 'IDEA',
                    priority: 'Trung bình',
                    start_date: today,
                    due_date: today,
                    result_links: '',
                    output: '',
                    notes: '',
                    parent_id: '',
                    format: '',
                    platform: '',
                    category: '',
                    target: '',
                    views: '',
                    interactions: '',
                    shares: '',
                    saves: '',
                    sections: []
                });
                setSubTasks([]);
                setNewSubtaskName('');
            }
        }
    }, [isOpen, editingTask, initialData]);

    const handleProjectChange = (projectId: string) => {
        setForm(prev => {
            const nextCode = generateNextTaskCode ? generateNextTaskCode(projectId) : prev.task_code;
            return {
                ...prev,
                project_id: projectId,
                task_code: nextCode,
                assignee_id: prev.assignee_id.length > 0 ? prev.assignee_id : (currentUserProfile?.id ? [currentUserProfile.id] : []),
                parent_id: '' // reset phase when project changes
            }
        });
    }

    

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);



    const shouldDisableTopFields = () => {
        return false;
    }

    const handleSave = async () => {
        try {
            let finalTaskCode = form.task_code;
            if (!finalTaskCode) {
                finalTaskCode = `TSK-${Math.floor(Date.now() / 1000)}`;
            }

            const payload = {
                name: form.name,
                task_code: finalTaskCode,
                description: form.description || null,
                assignee_id: form.assignee_id.length > 0 ? form.assignee_id : null,
                supporter_id: form.supporter_id || null,
                status: form.status,
                priority: form.priority,
                start_date: form.start_date || null,
                due_date: form.due_date || null,
                result_links: form.result_links || null,
                notes: form.notes || null,
                parent_id: form.parent_id || null,
                category: form.category || null,
                format: form.format || null,
                platform: form.platform || null,
                target: form.target || null,
                output: form.output || null,
                sections: form.sections && form.sections.length > 0 ? form.sections : null
                // Removed performance metrics from initial save payload to avoid "Column not found" schema errors.
            }

            let result;

            if (editingTask && editingTask.id) {
                result = await supabase.from('marketing_tasks').update(payload).eq('id', editingTask.id)
                if (result.error) {
                    console.error('Supabase Task Error:', result.error)
                    alert(`Lỗi Supabase(Nhiệm vụ): ${result.error.message} `)
                    return
                }
            } else {
                if (!form.project_id) {
                    alert('Vui lòng chọn dự án cho nhiệm vụ này.')
                    return
                }

                let retryCount = 0;
                let success = false;

                while (!success && retryCount < 10) {
                    result = await supabase.from('marketing_tasks').insert({
                        ...payload,
                        task_code: finalTaskCode,
                        project_id: form.project_id
                    }).select()

                    if (result?.error && result.error.message?.includes('duplicate key') && result.error.message?.includes('tasks_task_code_key')) {
                        retryCount++;
                        // increment task code to retry
                        const match = finalTaskCode.match(/^(.*?)-(\d+)$/);
                        if (match) {
                            const num = parseInt(match[2], 10);
                            finalTaskCode = `${match[1]}-${String(num + 1).padStart(2, '0')}`;
                        } else {
                            finalTaskCode = `${finalTaskCode}-${retryCount}`;
                        }
                    } else {
                        success = true;
                    }
                }

                if (result?.error) {
                    console.error('Supabase Task Error:', result.error)
                    alert(`Lỗi Supabase(Nhiệm vụ): ${result.error.message} `)
                    return
                }
            }

            // --- Auto-create Shooting Milestone ---
            const savedTaskId = editingTask ? editingTask.id : (result?.data as any[])?.[0]?.id;

            if (form.status === 'PROD_FILMING' && form.start_date && form.project_id && savedTaskId) {
                try {
                    const { data: existingMs } = await supabase.from('marketing_shooting_milestones')
                        .select('id')
                        .eq('task_id', savedTaskId);
                        
                    if (!existingMs || existingMs.length === 0) {
                        await supabase.from('marketing_shooting_milestones').insert({
                            project_id: form.project_id,
                            task_id: savedTaskId,
                            milestone_date: form.start_date,
                            content: form.name,
                            status: 'Chờ quay'
                        });
                    } else {
                         await supabase.from('marketing_shooting_milestones').update({
                            milestone_date: form.start_date,
                            content: form.name
                        }).eq('id', existingMs[0].id);
                    }
                } catch (msError) {
                    console.error('Error auto-creating shooting milestone:', msError);
                }
            }

            // --- Notifications ---
            // Multi-assignee support omitted for push notifications temporarily to avoid spamming multiple people on setup.
            // If needed, we can loop through form.assignee_id here.
            const newAssigneeIds: string[] = form.assignee_id || [];
            const oldAssigneeTuple = editingTask?.assignee_id;
            const oldAssigneeIds: string[] = Array.isArray(oldAssigneeTuple) ? oldAssigneeTuple : (oldAssigneeTuple ? [oldAssigneeTuple] : []);

            // Find newly assigned users
            const newlyAssigned = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));

            for (const assigneeId of newlyAssigned) {
                if (assigneeId && assigneeId !== currentUserProfile?.id) {
                    await createNotification(
                        assigneeId,
                        `${currentUserProfile?.full_name || 'Admin'} đã giao cho bạn nhiệm vụ: "${form.name}"`,
                        'assignment',
                        currentUserProfile?.id,
                        editingTask ? editingTask.id : (result?.data as any[])?.[0]?.id,
                        form.project_id,
                        'marketing'
                    );

                    // Gửi thông báo qua Telegram ngầm
                    try {
                        const taskLink = `${window.location.origin}/tasks`;
                        const dueStr = form.due_date ? format(parseISO(form.due_date), 'dd/MM/yyyy') : 'Chưa định';

                        fetch('/api/send-telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: assigneeId,
                                message: `🚀 *${currentUserProfile?.full_name || 'Admin'}* vừa giao cho bạn một nhiệm vụ mới!

📌 *${form.name}*
🗓 Hạn chót: ${dueStr}
📈 Ưu tiên: ${form.priority}`,
                                taskUrl: taskLink
                            })
                        }).catch(e => console.error('Lỗi gọi Telegram API:', e));
                    } catch (e) {
                        console.error('Lỗi thiết lập thông báo Telegram:', e);
                    }
                }
            }

            const newSupporterId = form.supporter_id;
            if (newSupporterId && newSupporterId !== currentUserProfile?.id) {
                // Check if it's a new supporter assignment
                const isNewSupporter = !editingTask || (editingTask.supporter_id !== newSupporterId);
                if (isNewSupporter) {
                    await createNotification(
                        newSupporterId,
                        `${currentUserProfile?.full_name || 'Admin'} đã thêm bạn làm Người thực hiện nhiệm vụ: "${form.name}"`,
                        'assignment',
                        currentUserProfile?.id,
                        editingTask ? editingTask.id : (result?.data as any[])?.[0]?.id,
                        form.project_id,
                        'marketing'
                    );

                    // Gửi thông báo qua Telegram ngầm cho Người thực hiện
                    try {
                        const taskLink = `${window.location.origin}/tasks`;
                        const dueStr = form.due_date ? format(parseISO(form.due_date), 'dd/MM/yyyy') : 'Chưa định';

                        fetch('/api/send-telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: newSupporterId,
                                message: `🤝 *${currentUserProfile?.full_name || 'Admin'}* vừa thêm bạn làm Người thực hiện cho một nhiệm vụ!

📌 *${form.name}*
🗓 Hạn chót: ${dueStr}
📈 Ưu tiên: ${form.priority}`,
                                taskUrl: taskLink
                            })
                        }).catch(e => console.error('Lỗi gọi Telegram API:', e));
                    } catch (e) {
                        console.error('Lỗi thiết lập thông báo Telegram:', e);
                    }
                }
            }
            // --- Logging ---
            if (editingTask) {
                let changes = [];
                if (editingTask.name !== form.name) {
                    changes.push(`Tên: ${editingTask.name} -> ${form.name}`);
                }
                if (editingTask.status !== form.status) {
                    changes.push(`Trạng thái: ${editingTask.status || 'Trống'} -> ${form.status}`);
                }
                const oldAssigneeArr = Array.isArray(editingTask.assignee_id) ? editingTask.assignee_id : (editingTask.assignee_id ? [editingTask.assignee_id] : []);
                const newAssigneeArr = form.assignee_id || [];
                if (JSON.stringify(oldAssigneeArr.sort()) !== JSON.stringify(newAssigneeArr.sort())) {
                    const oldAssigneeNames = oldAssigneeArr.map((id:string) => profiles.find((p:any) => p.id === id)?.full_name).filter(Boolean).join(', ') || 'Trống';
                    const newAssigneeNames = newAssigneeArr.map((id:string) => profiles.find((p:any) => p.id === id)?.full_name).filter(Boolean).join(', ') || 'Trống';
                    changes.push(`Chủ trì: ${oldAssigneeNames} -> ${newAssigneeNames}`);
                }
                if ((editingTask.supporter_id || '') !== (form.supporter_id || '')) {
                    const oldSup = profiles.find(p => p.id === editingTask.supporter_id)?.full_name || 'Trống';
                    const newSup = profiles.find(p => p.id === form.supporter_id)?.full_name || 'Trống';
                    changes.push(`Người thực hiện: ${oldSup} -> ${newSup}`);
                }
                if (editingTask.priority !== form.priority) {
                    changes.push(`Ưu tiên: ${editingTask.priority || 'Trống'} -> ${form.priority}`);
                }
                if ((editingTask.start_date || '') !== (form.start_date || '')) {
                    const oldDate = editingTask.start_date ? format(parseISO(editingTask.start_date), 'dd/MM/yyyy') : 'Trống';
                    const newDate = form.start_date ? format(parseISO(form.start_date), 'dd/MM/yyyy') : 'Trống';
                    changes.push(`Ngày bắt đầu: ${oldDate} -> ${newDate}`);
                }
                if ((editingTask.due_date || '') !== (form.due_date || '')) {
                    const oldDate = editingTask.due_date ? format(parseISO(editingTask.due_date), 'dd/MM/yyyy') : 'Trống';
                    const newDate = form.due_date ? format(parseISO(form.due_date), 'dd/MM/yyyy') : 'Trống';
                    changes.push(`Hạn chót: ${oldDate} -> ${newDate}`);
                }

                if (editingTask.notes !== form.notes) {
                    changes.push(`Ghi chú đã thay đổi`);
                }

                if (changes.length > 0) {
                    await logActivity('Sửa nhiệm vụ', `${changes.join('; ')} (Nhiệm vụ: ${form.name})`, editingTask.project_id);
                } else if (editingTask.description !== form.description || (editingTask.result_links || '') !== (form.result_links || '')) {
                    await logActivity('Sửa nhiệm vụ', `Cập nhật nội dung chi tiết (Nhiệm vụ: ${form.name})`, editingTask.project_id);
                }
            } else {
                await logActivity('Thêm nhiệm vụ', `Tạo mới: ${form.name}`, form.project_id);
            }
            // ---------------

            onSaved()
        } catch (err) {
            console.error('Task Catch Error:', err)
            alert('Lỗi hệ thống khi lưu nhiệm vụ.')
        }
    }; // <-- Missing this closing brace before handleAddSubtask

    const handleAddSubtask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newSubtaskName.trim()) {
            if (!editingTask?.id) {
                alert('Vui lòng tạo (Lưu) công việc chính trước khi thêm nhiệm vụ con.');
                return;
            }

            const subTaskName = newSubtaskName.trim();
            setNewSubtaskName(''); // Clear immediately for snappy UX

            try {
                let retryCount = 0;
                let success = false;
                let finalSubCode = `${editingTask.task_code}-${String(subTasks.length + 1).padStart(2, '0')}`;
                let finalData = null;

                while (!success && retryCount < 10) {
                    const { data, error } = await supabase.from('marketing_tasks').insert({
                        name: subTaskName,
                        project_id: editingTask.project_id,
                        parent_id: editingTask.id,
                        task_code: finalSubCode,
                        status: 'Chưa bắt đầu',
                        priority: 'Trung bình',
                        completion_pct: 0
                    }).select().single();

                    if (error && error.message?.includes('duplicate key') && error.message?.includes('tasks_task_code_key')) {
                        retryCount++;
                        // increment subtask code
                        const match = finalSubCode.match(/^(.*?)-(\d+)$/);
                        if (match) {
                            const num = parseInt(match[2], 10);
                            finalSubCode = `${match[1]}-${String(num + 1).padStart(2, '0')}`;
                        } else {
                            finalSubCode = `${finalSubCode}-${retryCount}`;
                        }
                    } else if (error) {
                        throw error;
                    } else {
                        success = true;
                        finalData = data;
                    }
                }

                if (finalData) {
                    // Update the list from server to ensure consistent ordering
                    const { data: updatedSubTasks } = await supabase
                        .from('marketing_tasks')
                        .select('*')
                        .eq('parent_id', editingTask.id)
                        .order('task_code', { ascending: true });

                    if (updatedSubTasks) setSubTasks(updatedSubTasks as Task[]);
                }
            } catch (err: any) {
                console.error('Error adding subtask:', err);
                alert(`Lỗi tạo nhiệm vụ con: ${err?.message || ''}`);
            }
        }
    };

    const toggleSubTask = async (id: string, isCompleted: boolean) => {
        // Optimistic update
        const newStatus = isCompleted ? 'Hoàn thành' : 'Chưa bắt đầu';
        const newPct = isCompleted ? 100 : 0;

        setSubTasks(prev => prev.map(st => st.id === id ? { ...st, status: newStatus, completion_pct: newPct } : st));

        try {
            const { error } = await supabase.from('marketing_tasks').update({
                status: newStatus,
                completion_pct: newPct,
                completion_date: isCompleted ? new Date().toISOString().split('T')[0] : null
            }).eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating subtask:', err);
            // Revert on error could be implemented here
        }
    };

    const updateSubTaskCode = async (id: string, newCode: string) => {
        try {
            const { error } = await supabase.from('marketing_tasks').update({ task_code: newCode }).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error updating task_code:', err);
        }
    };

    const removeSubTask = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ con này?')) return;

        // Optimistic remove
        setSubTasks(prev => prev.filter(st => st.id !== id));

        try {
            const { error } = await supabase.from('marketing_tasks').update({ isarchived: true }).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting subtask:', err);
        }
    };

    const updateSubTaskAssignee = async (id: string, assigneeId: string) => {
        const newVal = assigneeId ? [assigneeId] : null;
        setSubTasks(prev => prev.map(st => st.id === id ? { ...st, assignee_id: newVal as any } : st));
        try {
            const { error } = await supabase.from('marketing_tasks').update({ assignee_id: newVal }).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error updating subtask assignee:', err);
        }
    };

    const onDragEndSubtasks = async (result: DropResult) => {
        if (!result.destination || !editingTask) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const newSubTasks = Array.from(subTasks);
        const [movedItem] = newSubTasks.splice(sourceIndex, 1);
        newSubTasks.splice(destinationIndex, 0, movedItem);

        // Optimistically update state
        setSubTasks(newSubTasks.map((st, index) => {
            const newCode = `${editingTask.task_code}-${String(index + 1).padStart(2, '0')}`;
            return { ...st, task_code: newCode };
        }));

        // Fire DB updates sequentially
        try {
            for (let i = 0; i < newSubTasks.length; i++) {
                const subTask = newSubTasks[i];
                const newCode = `${editingTask.task_code}-${String(i + 1).padStart(2, '0')}`;
                await supabase.from('marketing_tasks').update({ task_code: newCode }).eq('id', subTask.id);
            }
        } catch (err) {
            console.error('Error reordering subtasks:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[1020px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] my-auto">

                    {/* Header */}
                    <div className="px-8 py-6 flex justify-between items-start bg-white shrink-0">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                {/* Nút delete nhỏ ở góc thay vì nằm cạnh title */}
                                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                                    <AlignLeft size={20} />
                                </div>
                                {editingTask ? (
                                    <>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="text-2xl font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none focus:ring-0 p-0 flex-1 min-w-[300px] transition-colors"
                                            placeholder="Nhập tiêu đề công việc..."
                                        />
                                        <div className="flex gap-1 ml-2">
                                            <button
                                                onClick={() => handleSpeechToText('name')}
                                                className={`p-1.5 rounded-lg transition-colors ${isListening === 'name' ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                title="Ghi âm tiêu đề"
                                            >
                                                {isListening === 'name' ? <MicOff size={16} /> : <Mic size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleAIRefine('name')}
                                                disabled={isRefining === 'name'}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="AI tinh chỉnh"
                                            >
                                                {isRefining === 'name' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Tạo Công Việc Mới
                                    </h2>
                                )}
                            </div>
                            <div className="mt-1 ml-14 flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={form.task_code}
                                        onChange={(e) => setForm({ ...form, task_code: e.target.value })}
                                        className="text-sm font-medium text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-0 p-0 w-32 sm:w-48 transition-colors"
                                        placeholder="Mã dự án (Ví dụ: UX/UI-A1)"
                                    />
                                    <select
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                        className={`bg-transparent border border-slate-200 rounded-md text-xs font-bold focus:ring-1 focus:ring-slate-300 outline-none cursor-pointer px-2 py-0.5 shadow-sm ${form.priority === 'Khẩn cấp' ? 'text-red-600 bg-red-50 border-red-200' :
                                            form.priority === 'Cao' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                                                form.priority === 'Trung bình' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-600 bg-slate-50 border-slate-200'
                                            }`}
                                        disabled={shouldDisableTopFields()}
                                    >
                                        <option value="Thấp">Thấp</option>
                                        <option value="Trung bình">Trung bình</option>
                                        <option value="Cao">Cao</option>
                                    </select>
                                </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {editingTask && (currentUserProfile?.role === 'Admin' || (Array.isArray(editingTask.assignee_id) ? editingTask.assignee_id.includes(currentUserProfile?.id) : editingTask.assignee_id === currentUserProfile?.id)) && (
                                <div className="flex bg-slate-100 rounded-xl overflow-hidden mr-2 items-center">
                                    <button 
                                      type="button"
                                      onClick={async () => {
                                        if (confirm('Bạn có chắc chắn muốn Lưu Trữ (Archive) nhiệm vụ này? Hành động này sẽ chuyển nó vào mục Lưu trữ.')) {
                                            try {
                                                const { error } = await supabase.from('marketing_tasks').update({ isarchived: true }).eq('id', editingTask.id);
                                                if (error) throw error;
                                                onSaved();
                                                onClose();
                                            } catch (err) {
                                                console.error('Lỗi khi lưu trữ nhiệm vụ:', err);
                                                alert('Lỗi. Vui lòng thử lại.');
                                            }
                                        }
                                      }}
                                      className="px-3 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 transition-colors text-xs font-bold whitespace-nowrap"
                                      title="Lưu trữ công việc (Đưa vào mục Archive)"
                                    >
                                        Lưu Trữ
                                    </button>
                                    <div className="w-[1px] h-4 bg-slate-300"></div>
                                    <button 
                                      onClick={async () => {
                                        if (confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này? (Nhiệm vụ sẽ được chuyển vào mục Lưu trữ)')) {
                                            try {
                                                const { error } = await supabase.from('marketing_tasks').update({ isarchived: true }).eq('id', editingTask.id);
                                                if (error) throw error;
                                                onSaved();
                                                onClose();
                                            } catch (err) {
                                                console.error('Lỗi khi xóa nhiệm vụ:', err);
                                                alert('Lỗi khi xóa nhiệm vụ. Vui lòng thử lại.');
                                            }
                                        }
                                    }} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Xóa vĩnh viễn">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body scrollable */}
                    <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">

                        {!editingTask && (
                            <div className="mb-6 ml-14">
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full text-xl font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                                    placeholder="Nhập tiêu đề công việc..."
                                    disabled={shouldDisableTopFields()}
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Form Grid Layout - Clean 3 Columns */}
                        <div className="space-y-6">
                            {/* Full width Project Select */}
                            <div className="px-14">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Folder size={12} /> Dự án</div>
                                <select
                                    value={form.project_id}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer transition-all"
                                    disabled={shouldDisableTopFields()}
                                >
                                    <option value="">Chọn dự án...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                                                        <div className="px-8 mt-4 mb-6 relative z-10">
                                <div className="flex border border-slate-200 rounded-xl bg-white shadow-sm">
                                    <div className="flex-1 p-3 border-r border-slate-200">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Trạng thái</div>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                                            className="w-full bg-transparent border-none text-[13px] font-semibold text-slate-800 p-0 focus:ring-0 cursor-pointer"
                                            disabled={shouldDisableTopFields()}
                                        >
                                            <option value="IDEA">Idea</option>
                                            <option value="CONTENT_EDITING">Viết Content (Đang soạn)</option>
                                            <option value="CONTENT_DONE">Viết Content (Chờ duyệt)</option>
                                            <option value="PROD_FILMING">Sản xuất (Đang Quay)</option>
                                            <option value="PROD_EDITING">Sản xuất (Đang Edit)</option>
                                            <option value="PROD_DONE">Sản xuất (Đã xong)</option>
                                            <option value="VIDEO_REVIEW">Gửi qua Phê duyệt</option>
                                            <option value="SCHEDULED">Chưa đăng (Đã xếp lịch)</option>
                                            <option value="PUBLISHED">Hoàn thành đăng</option>
                                            <option value="REJECTED">Từ chối / Để sau</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 p-3 border-r border-slate-200 relative group/assignee dropdown-container">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Người thực hiện</div>
                                        <div className="cursor-pointer text-[13px] font-semibold text-slate-800 truncate" onClick={(e) => { e.stopPropagation(); document.getElementById('assignee-dropdown-popup2')?.classList.toggle('hidden'); }}>
                                            {form.assignee_id.length > 0
                                                ? form.assignee_id.map(id => profiles.find(p => p.id === id)?.full_name).filter(Boolean).join(', ')
                                                : 'Chọn người...'}
                                        </div>
                                        <div id="assignee-dropdown-popup2" className="hidden absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 shadow-xl rounded-xl z-50 max-h-60 overflow-y-auto py-2">
                                            {profiles.map(p => (
                                                <label key={p.id} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
                                                    <input type="checkbox" checked={form.assignee_id.includes(p.id)} onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setForm(prev => ({
                                                            ...prev,
                                                            assignee_id: checked ? [...prev.assignee_id, p.id] : prev.assignee_id.filter(id => id !== p.id)
                                                        }));
                                                    }} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                                    <span className="text-[13px] font-medium text-slate-700">{p.full_name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 p-3 border-r border-slate-200">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Nền tảng</div>
                                        <select
                                            value={form.platform || ''}
                                            onChange={(e) => setForm({ ...form, platform: e.target.value })}
                                            className="w-full bg-transparent border-none text-[13px] font-semibold text-slate-800 p-0 focus:ring-0 cursor-pointer"
                                            disabled={shouldDisableTopFields()}
                                        >
                                            <option value="">Chọn nền tảng...</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="YouTube">YouTube</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 p-3 border-r border-slate-200">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Định dạng</div>
                                        <select
                                            value={form.format || ''}
                                            onChange={(e) => setForm({ ...form, format: e.target.value })}
                                            className="w-full bg-transparent border-none text-[13px] font-semibold text-slate-800 p-0 focus:ring-0 cursor-pointer"
                                            disabled={shouldDisableTopFields()}
                                        >
                                            <option value="">Chọn định dạng...</option>
                                            <option value="Video ngắn">Video ngắn</option>
                                            <option value="Video dài">Video dài</option>
                                            <option value="Bài viết MXH">Bài viết mạng xã hội</option>
                                            <option value="Hình ảnh">Hình ảnh/Album</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 p-3">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Lịch đăng</div>
                                        <input
                                            type="date"
                                            value={form.due_date}
                                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                            className="w-full bg-transparent border-none text-[13px] font-semibold text-slate-800 p-0 focus:ring-0 cursor-pointer"
                                            disabled={shouldDisableTopFields()}
                                        />
                                    </div>
                                </div>
                            </div>

                            

                            {/* Details Content Table */}
                            <div className="px-8 mb-6">
                                <MarketingSectionTable 
                                    sections={form.sections} 
                                    onChange={(newSections: any[]) => setForm({ ...form, sections: newSections })} 
                                />
                            </div>
                            

                            {/* Tabs Section */}
                            <div className="mt-8 pl-14 pr-4">
                                <div className="flex gap-6 border-b border-slate-200 mb-6">
                                    <button
                                        onClick={() => setActiveTab('subtasks')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'subtasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <ListTodo size={16} /> Subtasks <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs ml-1">{subTasks.length}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('comments')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <MessageSquare size={16} /> Comments
                                    </button>
                                    {/* Attachments Tab */}
                                    <button
                                        onClick={() => setActiveTab('links')}
                                        className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'links'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : form.result_links
                                                ? 'border-transparent text-indigo-500 hover:border-slate-300 hover:text-indigo-600'
                                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                            }`}
                                    >
                                        <LinkIcon size={16} /> Đính kèm / Link
                                    </button>
                                </div>

                                {/* Tab Content: Subtasks */}
                                {activeTab === 'subtasks' && (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        {isLoadingSubtasks ? (
                                            <div className="text-center py-4 text-slate-400 text-sm">Đang tải nhiệm vụ con...</div>
                                        ) : subTasks.length === 0 && !editingTask?.id ? (
                                            <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-sm font-medium">
                                                Vui lòng lưu công việc chính trước khi thêm nhiệm vụ con.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <DragDropContext onDragEnd={onDragEndSubtasks}>
                                                    <Droppable droppableId={`subtasks-${editingTask?.id || 'new'}`}>
                                                        {(provided) => (
                                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                                                {subTasks.map((st, index) => {
                                                                    const isCompleted = st.status === 'Hoàn thành';
                                                                    return (
                                                                        <Draggable key={st.id} draggableId={st.id} index={index}>
                                                                            {(provided, snapshot) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    className={`flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm group hover:border-indigo-300 transition-colors
                                                                                    ${snapshot.isDragging ? 'shadow-lg border-indigo-400 rotate-1 z-50' : ''}
                                                                                `}
                                                                                >
                                                                                    <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab px-1">
                                                                                        <GripVertical size={16} />
                                                                                    </div>
                                                                                    <div className="pt-0.5 shrink-0 relative flex items-center justify-center">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isCompleted}
                                                                                            onChange={(e) => toggleSubTask(st.id, e.target.checked)}
                                                                                            className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 z-10 opacity-0 absolute cursor-pointer"
                                                                                        />
                                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-slate-300'}`}>
                                                                                            {isCompleted && <CheckCircle2 size={14} className="stroke-[3]" />}
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleOpenDeepLink(st.id)}
                                                                                        className={`flex-1 text-sm font-medium text-left transition-colors hover:text-indigo-600 focus:outline-none ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}
                                                                                    >
                                                                                        {st.name}
                                                                                    </button>
                                                                                    <select
                                                                                        value={Array.isArray(st.assignee_id) ? ((st.assignee_id as any[])[0] || '') : (st.assignee_id || '')}
                                                                                        onChange={(e) => updateSubTaskAssignee(st.id, e.target.value)}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="text-[10px] font-bold bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-300 cursor-pointer min-w-[80px] max-w-[100px] truncate appearance-none transition-colors"
                                                                                        title="Chỉ định người thực hiện"
                                                                                    >
                                                                                        <option value="">--</option>
                                                                                        {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                                                                    </select>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={st.task_code || ''}
                                                                                        onChange={(e) => setSubTasks(prev => prev.map(item => item.id === st.id ? { ...item, task_code: e.target.value } : item))}
                                                                                        onBlur={(e) => updateSubTaskCode(st.id, e.target.value)}
                                                                                        className="text-[10px] font-mono text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border-none focus:ring-1 focus:ring-indigo-300 min-w-[140px] transition-colors cursor-text"
                                                                                        placeholder="Mã..."
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => handleOpenDeepLink(st.id)}
                                                                                        className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-50 hover:bg-white border border-transparent shadow-sm hover:border-slate-200 hover:shadow rounded-lg ml-2"
                                                                                        title="Mở chi tiết (Cửa sổ mới)"
                                                                                    >
                                                                                        <ExternalLink size={16} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => removeSubTask(st.id)}
                                                                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-1 bg-slate-50 hover:bg-red-50 rounded-lg"
                                                                                        title="Xóa Subtask"
                                                                                    >
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    );
                                                                })}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </DragDropContext>

                                                {editingTask?.id && (
                                                    <div className="relative mt-4 flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                value={newSubtaskName}
                                                                onChange={(e) => setNewSubtaskName(e.target.value)}
                                                                onKeyDown={handleAddSubtask}
                                                                placeholder="Nhập nhiệm vụ con và nhấn Enter..."
                                                                className="w-full py-3 pl-12 pr-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all placeholder:text-slate-400"
                                                            />
                                                            <Plus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                        <button
                                                            onClick={() => handleSpeechToText('subtask')}
                                                            className={`p-2.5 rounded-xl transition-all border ${isListening === 'subtask' ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white shadow-sm'}`}
                                                            title="Ghi âm nhiệm vụ con"
                                                        >
                                                            {isListening === 'subtask' ? <MicOff size={20} /> : <Mic size={20} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab Content: Comments */}
                                {activeTab === 'comments' && (
                                    <div className="animate-in fade-in duration-200 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                        {editingTask?.id ? (
                                            <CommentSection
                                                taskId={editingTask.id}
                                                currentUserProfile={currentUserProfile}
                                                profiles={profiles}
                                                itemName={editingTask.name}
                                                moduleType="marketing"
                                            />
                                        ) : (
                                            <div className="text-center py-8 text-slate-400 text-sm font-medium">
                                                Vui lòng lưu nhiệm vụ trước khi có thể trao đổi bình luận.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab Content: Links */}
                                {activeTab === 'links' && (
                                    <div className="animate-in fade-in duration-200">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                                <LinkIcon size={16} /> Đường dẫn kết quả / File Google Drive
                                            </label>
                                            <textarea
                                                value={form.result_links}
                                                onChange={(e) => setForm({ ...form, result_links: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                                                placeholder="Paste link Figma, Google Drive, Docs vào đây..."
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* Footer fixed */}
                    <div className="px-8 py-5 bg-white border-t border-slate-100 flex justify-between gap-3 shrink-0 rounded-b-3xl items-center">
                        <div>
                            {editingTask && (currentUserProfile?.role === 'Admin' || (Array.isArray(editingTask.assignee_id) ? editingTask.assignee_id.includes(currentUserProfile?.id) : editingTask.assignee_id === currentUserProfile?.id)) && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('Bạn có chắc chắn muốn chuyển nhiệm vụ này vào Lưu trữ?')) return;
                                        try {
                                            const { error } = await supabase.from('marketing_tasks').update({ isarchived: true }).eq('id', editingTask.id);
                                            if (error) throw error;
                                            onSaved();
                                            onClose();
                                        } catch (err) {
                                            console.error(err);
                                            alert('Lỗi lưu trữ');
                                        }
                                    }}
                                    className="px-5 py-2.5 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                    title="Chuyển Task này vào mục Lưu trữ"
                                >
                                    <Archive size={16} /> Lưu trữ
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 items-center">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 border-0 hover:bg-slate-100 bg-transparent rounded-xl text-sm font-bold text-slate-600 transition-colors"
                            >
                                Hủy
                            </button>

                        {editingTask && form.status === 'Chờ duyệt' && ['Admin', 'Quản lý', 'Giám đốc'].includes(currentUserProfile?.role?.trim() || '') && (
                            currentUserProfile?.role === 'Admin' ||
                            currentUserProfile?.role === 'Quản lý' ||
                            projects.find(p => p.id === form.project_id)?.manager_id === currentUserProfile?.id ||
                            editingTask.assignee_id === currentUserProfile?.id
                        ) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const { error } = await supabase.from('tasks').update({
                                                status: 'Hoàn thành',
                                                completion_pct: 100,
                                                completion_date: new Date().toLocaleDateString('sv-SE')
                                            }).eq('id', editingTask.id);

                                            if (error) throw error;
                                            await logActivity('Duyệt nhiệm vụ', `Đã duyệt hoàn thành (Nhiệm vụ: ${form.name})`, form.project_id);
                                            onSaved();
                                            onClose();
                                        } catch (err) {
                                            console.error('Error approving task:', err);
                                            alert('Lỗi khi duyệt nhiệm vụ.');
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Duyệt Hoàn Thành
                                </button>
                            )}

                            <button
                                onClick={handleSave}
                                className="px-8 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                            >
                                Lưu Lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {drilledSubtask && (
                <MarketingTaskModal
                    isOpen={!!drilledSubtask}
                    onClose={() => setDrilledSubtask(null)}
                    onSaved={() => {
                        setDrilledSubtask(null);
                        // Force subtasks refresh to get latest names/codes/statuses
                        if (editingTask?.id) {
                            supabase.from('marketing_tasks').select('*').eq('parent_id', editingTask.id).order('task_code', { ascending: true })
                                .then(({ data }) => setSubTasks((data || []) as Task[]));
                        }
                    }}
                    editingTask={drilledSubtask}
                    initialData={{ task_code: drilledSubtask.task_code, project_id: drilledSubtask.project_id }}
                    projects={projects}
                    profiles={profiles}
                    currentUserProfile={currentUserProfile}
                    generateNextTaskCode={generateNextTaskCode}
                />
            )}
        </>
    )
}
