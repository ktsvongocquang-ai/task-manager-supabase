import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { X, Plus, Trash2, CheckCircle2, Calendar, User, Folder, Flag, AlignLeft, Link as LinkIcon, ListTodo, MessageSquare, ExternalLink, GripVertical, Mic, MicOff, Sparkles, Loader2, Mail } from 'lucide-react'
import { logActivity } from '../../services/activity';
import { createNotification } from '../../services/notifications';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { CommentSection } from '../../components/chat/CommentSection';
import { format, parseISO } from 'date-fns';
import { getAssignableProfiles } from '../../utils/profileUtils';

interface AddEditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingTask: Task | null;
    initialData: {
        task_code: string;
        project_id: string;
        start_date?: string;
        due_date?: string;
        assignee_id?: string;
    };
    projects: Project[];
    profiles: any[];
    currentUserProfile: any;
    generateNextTaskCode?: (projectId: string) => Promise<string> | string;
    onDeleteTask?: (task: Task) => void;
}

export const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
    isOpen,
    onClose,
    onSaved,
    editingTask,
    initialData,
    projects,
    profiles,
    currentUserProfile,
    generateNextTaskCode,
    onDeleteTask
}) => {
    const [form, setForm] = useState({
        task_code: '', project_id: '', name: '', description: '', assignee_id: '',
        supporter_id: '', status: 'Cần làm', priority: 'DQH', start_date: '', start_time: '', due_date: '', due_time: '',
        result_links: '', notes: '', parent_id: '', target: ''
    });

    const [subTasks, setSubTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'links'>('subtasks');
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);

    // Deep link state for subtasks
    const [drilledSubtask, setDrilledSubtask] = useState<Task | null>(null);

    // Ref for auto-scroll after adding subtask
    const subtaskInputRef = useRef<HTMLDivElement>(null);

    const assignableProfiles = React.useMemo(() => {
        const currentAssignees = [form.assignee_id, form.supporter_id, ...subTasks.map(st => st.assignee_id)].filter(Boolean) as string[];
        return getAssignableProfiles(profiles, form.target, currentAssignees);
    }, [profiles, form.target, form.assignee_id, form.supporter_id, subTasks]);

    // AI & Speech states
    const [isListening, setIsListening] = useState<'name' | 'description' | 'subtask' | null>(null);
    const [isRefining, setIsRefining] = useState<'name' | 'description' | null>(null);

    const handleSpeechToText = (field: 'name' | 'description' | 'subtask') => {
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
            console.error('Speech recognition error:', event.error);

            let messageStr = "Lỗi nhận diện giọng nói.";
            if (event.error === 'not-allowed') {
                messageStr = "Không có quyền truy cập Micro. Hãy kiểm tra cài đặt trình duyệt/điện thoại.";
            } else if (event.error === 'service-not-allowed') {
                messageStr = "Công cụ giọng nói bị chặn (có thể do Siri đang bật hoặc hết hạn mức).";
            } else if (event.error === 'no-speech') {
                messageStr = "Không nghe thấy tiếng. Vui lòng thử lại.";
            }

            alert(messageStr);
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

    const handleAIRefine = async (field: 'name' | 'description') => {
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

    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const handleSendEmail = async () => {
        if (!form.assignee_id) {
            alert('Vui lòng chọn chủ trì để gửi email.');
            return;
        }
        
        const assignee = profiles.find(p => p.id === form.assignee_id);
        if (!assignee || !assignee.email) {
            alert('Không tìm thấy email của nhân sự này.');
            return;
        }

        setIsSendingEmail(true);
        try {
            const project = projects.find(p => p.id === form.project_id);
            const res = await fetch('/api/send-ai-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_email: assignee.email,
                    subject: `[Task Manager] Bạn được giao một công việc mới: ${form.name}`,
                    template_data: {
                        actor_name: currentUserProfile?.full_name || 'Hệ thống',
                        action: 'đã giao cho bạn công việc',
                        task_title: form.name,
                        project_name: project ? project.name : 'Công việc nội bộ',
                        priority: form.priority,
                        due_date: form.due_date || 'Chưa định',
                        task_url: `${window.location.origin}/tasks`
                    }
                })
            });

            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            if (data.success) {
                alert('Đã gửi email thông báo thành công!');
            } else {
                throw new Error(data.error || 'Lỗi gửi mail');
            }
        } catch (err) {
            console.error(err);
            alert('Có lỗi xảy ra khi gửi email qua AI.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleOpenDeepLink = async (subtaskId: string) => {
        const { data } = await supabase.from('tasks').select('*').eq('id', subtaskId).single();
        if (data) {
            setDrilledSubtask(data as Task);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                const today = new Date().toISOString().split('T')[0];
                setForm({
                    task_code: editingTask.task_code || initialData.task_code, 
                    project_id: editingTask.project_id || initialData.project_id, 
                    name: editingTask.name || '', 
                    description: editingTask.description || '',
                    assignee_id: editingTask.assignee_id || currentUserProfile?.id || '', 
                    supporter_id: editingTask.supporter_id || '', 
                    status: editingTask.status || 'Cần làm', 
                    priority: editingTask.priority || 'Trung bình',
                    start_date: editingTask.start_date || today, 
                    start_time: editingTask.start_time || '',
                    due_date: editingTask.due_date || today, 
                    due_time: editingTask.due_time || '',
                    result_links: editingTask.result_links || '', 
                    notes: editingTask.notes || '',
                    parent_id: editingTask.parent_id || '',
                    target: editingTask.target || ''
                });

                // Fetch actual subtasks from Supabase
                const fetchSubtasks = async () => {
                    if (!editingTask.id) return;
                    setIsLoadingSubtasks(true);
                    try {
                        const { data, error } = await supabase
                            .from('tasks')
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
                    task_code: initialData.task_code,
                    project_id: initialData.project_id,
                    name: '',
                    description: '',
                    assignee_id: initialData.assignee_id || currentUserProfile?.id || '',
                    supporter_id: '',
                    status: 'Cần làm',
                    priority: 'DQH',
                    start_date: initialData.start_date || today,
                    start_time: '',
                    due_date: initialData.due_date || today,
                    due_time: '',
                    result_links: '',
                    notes: '',
                    parent_id: '',
                    target: ''
                });
                setSubTasks([]);
                setNewSubtaskName('');
            }
        }
    }, [isOpen, editingTask, initialData]);

    const handleProjectChange = async (projectId: string) => {
        const nextCode = generateNextTaskCode ? await generateNextTaskCode(projectId) : form.task_code;
        setForm(prev => ({
            ...prev,
            project_id: projectId,
            task_code: nextCode,
            assignee_id: currentUserProfile?.id || prev.assignee_id,
            parent_id: '',
            target: prev.target // keep phase when changing project
        }));
    }

    // phases are now fixed KPI phases (concept, 3d, 2d, construction)

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
            const payload = {
                name: form.name,
                task_code: form.task_code,
                description: form.description || null,
                assignee_id: form.assignee_id || null,
                supporter_id: form.supporter_id || null,
                status: form.status,
                priority: form.priority,
                start_date: form.start_date || null,
                start_time: form.start_time || null,
                due_date: form.due_date || null,
                due_time: form.due_time || null,
                result_links: form.result_links || null,
                notes: form.notes || null,
                parent_id: form.parent_id || null,
                target: form.target || null
            }

            if (form.project_id === 'personal') {
                const personalPayload = {
                    title: form.name,
                    description: form.description || null,
                    status: form.status === 'Hoàn thành' ? 'done' : (form.status === 'Đang làm' ? 'in-progress' : 'pending'),
                    due_date: form.due_date || null,
                    due_time: form.due_time || null,
                    start_time: form.start_time || null,
                    priority: form.priority,
                    user_id: currentUserProfile?.id
                };
                
                let result;
                if (editingTask && editingTask.id) {
                    result = await supabase.from('personal_tasks').update(personalPayload).eq('id', editingTask.id);
                } else {
                    result = await supabase.from('personal_tasks').insert(personalPayload).select();
                }
                
                if (result?.error) {
                    alert(`Lỗi Supabase (Việc cá nhân): ${result.error.message}`);
                    return;
                }
                onSaved();
                return;
            }

            let result;
            let finalTaskCode = form.task_code;

            if (editingTask && editingTask.id) {
                result = await supabase.from('tasks').update(payload).eq('id', editingTask.id)
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
                    result = await supabase.from('tasks').insert({
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

            // --- Notifications ---
            const newAssigneeId = form.assignee_id;
            if (newAssigneeId && newAssigneeId !== currentUserProfile?.id) {
                // Check if it's a new assignment
                const isNewAssignment = !editingTask || (editingTask.assignee_id !== newAssigneeId);
                if (isNewAssignment) {
                    await createNotification(
                        newAssigneeId,
                        `${currentUserProfile?.full_name || 'Admin'} đã giao cho bạn nhiệm vụ: "${form.name}"`,
                        'assignment',
                        currentUserProfile?.id,
                        editingTask ? editingTask.id : (result?.data as any[])?.[0]?.id, // Ideally insert returns data if we do .select() but let's just use form project
                        form.project_id
                    );

                    // Gửi thông báo qua Telegram ngầm
                    try {
                        const taskLink = `${window.location.origin}/tasks`;
                        const dueStr = form.due_date ? format(parseISO(form.due_date), 'dd/MM/yyyy') : 'Chưa định';

                        fetch('/api/send-telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: newAssigneeId,
                                message: `🚀 *${currentUserProfile?.full_name || 'Admin'}* vừa giao cho bạn một nhiệm vụ mới!\n\n📌 *${form.name}*\n🗓 Hạn chót: ${dueStr}\n📈 Ưu tiên: ${form.priority}`,
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
                        editingTask ? editingTask.id : (result?.data as any[])?.[0]?.id, // Ideally insert returns data if we do .select() but let's just use form project
                        form.project_id
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
                                message: `🤝 *${currentUserProfile?.full_name || 'Admin'}* vừa thêm bạn làm Người thực hiện cho một nhiệm vụ!\n\n📌 *${form.name}*\n🗓 Hạn chót: ${dueStr}\n📈 Ưu tiên: ${form.priority}`,
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
                if ((editingTask.assignee_id || '') !== (form.assignee_id || '')) {
                    const oldAssignee = profiles.find(p => p.id === editingTask.assignee_id)?.full_name || 'Trống';
                    const newAssignee = profiles.find(p => p.id === form.assignee_id)?.full_name || 'Trống';
                    changes.push(`Chủ trì: ${oldAssignee} -> ${newAssignee}`);
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
                    const { data, error } = await supabase.from('tasks').insert({
                        name: subTaskName,
                        project_id: editingTask.project_id,
                        parent_id: editingTask.id,
                        task_code: finalSubCode,
                        status: 'Cần làm',
                        priority: 'DQH',
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
                        .from('tasks')
                        .select('*')
                        .eq('parent_id', editingTask.id)
                        .order('task_code', { ascending: true });

                    if (updatedSubTasks) {
                        setSubTasks(updatedSubTasks as Task[]);
                        // Auto-scroll to subtask input after adding
                        setTimeout(() => {
                            subtaskInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }
                }
            } catch (err: any) {
                console.error('Error adding subtask:', err);
                alert(`Lỗi tạo nhiệm vụ con: ${err?.message || ''}`);
            }
        }
    };

    const toggleSubTask = async (id: string, isCompleted: boolean) => {
        // Optimistic update
        const newStatus = isCompleted ? 'Hoàn thành' : 'Cần làm';
        const newPct = isCompleted ? 100 : 0;

        setSubTasks(prev => prev.map(st => st.id === id ? { ...st, status: newStatus, completion_pct: newPct } : st));

        try {
            const { error } = await supabase.from('tasks').update({
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
            const { error } = await supabase.from('tasks').update({ task_code: newCode }).eq('id', id);
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
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting subtask:', err);
        }
    };

    const updateSubTaskAssignee = async (id: string, assigneeId: string) => {
        const newVal = assigneeId || null;
        setSubTasks(prev => prev.map(st => st.id === id ? { ...st, assignee_id: newVal } : st));
        try {
            const { error } = await supabase.from('tasks').update({ assignee_id: newVal }).eq('id', id);
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
                await supabase.from('tasks').update({ task_code: newCode }).eq('id', subTask.id);
            }
        } catch (err) {
            console.error('Error reordering subtasks:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 z-[9999]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 animate-in fade-in duration-200"></div>
            <div className="fixed inset-0 z-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4 text-left">
                    <div className="relative transform bg-white sm:rounded-3xl shadow-2xl w-full sm:max-w-3xl animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="sticky top-0 z-20 px-4 sm:px-8 py-5 sm:py-6 flex justify-between items-start bg-white sm:rounded-t-3xl border-b border-slate-100/50">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                {editingTask ? (
                                    <>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="text-[22px] sm:text-2xl font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#4F46E5] focus:outline-none focus:ring-0 p-0 flex-1 min-w-0 w-full transition-colors tracking-tight"
                                            placeholder="Nhập tiêu đề công việc..."
                                        />
                                        <div className="flex gap-1 ml-2 shrink-0">
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
                                    <h2 className="text-2xl font-bold text-slate-800 flex-1">
                                        Tạo Công Việc Mới
                                    </h2>
                                )}
                                {editingTask && (
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ml-2 shrink-0 ${form.priority === 'JUX' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {form.priority}
                                    </span>
                                )}
                            </div>
                            {editingTask && form.task_code && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-4 py-1.5 bg-[#E0E7FF] text-[#4F46E5] text-[13px] font-bold rounded-full">
                                        {form.task_code}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        {projects.find(p => p.id === form.project_id)?.name || ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {editingTask && (!shouldDisableTopFields() || editingTask.assignee_id === currentUserProfile?.id) && (
                                <button onClick={async () => {
                                    if (confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này? Hành động này không thể hoàn tác.')) {
                                        try {
                                            const table = form.project_id === 'personal' ? 'personal_tasks' : 'tasks';
                                            const { error } = await supabase.from(table).delete().eq('id', editingTask.id);
                                            if (error) throw error;
                                            onSaved();
                                            onClose();
                                        } catch (err) {
                                            console.error('Lỗi khi xóa nhiệm vụ:', err);
                                            alert('Lỗi khi xóa nhiệm vụ. Vui lòng thử lại.');
                                        }
                                    }
                                }} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors bg-slate-50">
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body scrollable natively by parent */}
                    <div className="px-4 sm:px-8 py-6 sm:py-8">

                        {!editingTask && (
                            <div className="mb-5 sm:mb-6">
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

                        {/* Form Grid Layout - Compact */}
                        <div className="space-y-4">

                            {/* Row 1: Bắt đầu | Hạn chót (thời gian lên trước) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Bắt đầu</label>
                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                        <input
                                            type="date"
                                            value={form.start_date}
                                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                            className="w-full sm:w-2/3 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] font-bold transition-all shadow-sm"
                                        />
                                        <input
                                            type="time"
                                            value={form.start_time}
                                            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                            className="hidden md:block w-full sm:w-1/3 px-2 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] font-bold text-center transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Hạn chót</label>
                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                        <input
                                            type="date"
                                            value={form.due_date}
                                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                            className="w-full sm:w-2/3 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] font-bold transition-all shadow-sm"
                                        />
                                        <input
                                            type="time"
                                            value={form.due_time}
                                            onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                                            className="hidden md:block w-full sm:w-1/3 px-2 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] font-bold text-center transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Trạng thái | Giai đoạn */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Trạng thái</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] cursor-pointer hover:border-slate-300 transition-all shadow-sm"
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
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Giai đoạn</label>
                                    <select
                                        value={form.target || ''}
                                        onChange={(e) => setForm({ ...form, target: e.target.value })}
                                        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] cursor-pointer hover:border-slate-300 transition-all shadow-sm ${shouldDisableTopFields() ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        disabled={shouldDisableTopFields()}
                                    >
                                        <option value="">Chưa gán</option>
                                        <option value="concept">Concept (Thiết kế)</option>
                                        <option value="3d">3D / Phối cảnh (Thiết kế)</option>
                                        <option value="2d">2D / Triển khai (Triển khai)</option>
                                        <option value="construction">Construction / Hồ sơ TC (Thi công)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 3: Chủ trì | Thực hiện */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Chủ trì</label>
                                    <div className="flex gap-1.5 items-center">
                                        <select
                                            value={form.assignee_id}
                                            onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                                            className={`flex-1 px-3 py-2 bg-[#F5F8FF] border border-[#E5EDFF] rounded-xl text-[13px] text-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 font-bold cursor-pointer hover:bg-[#E0E7FF] transition-colors ${shouldDisableTopFields() ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            disabled={shouldDisableTopFields()}
                                        >
                                            <option value="" className="text-slate-400 font-normal">Chọn...</option>
                                            {assignableProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                                        </select>
                                        {form.assignee_id && (
                                            <button 
                                                onClick={handleSendEmail}
                                                disabled={isSendingEmail}
                                                className="hidden md:flex p-1.5 rounded-xl text-[#4F46E5] hover:bg-[#E0E7FF] transition-colors border border-[#E5EDFF] shadow-sm items-center justify-center disabled:opacity-50 shrink-0 h-[38px] w-[38px]"
                                                title="Gửi Email Thông Báo Bằng AI"
                                            >
                                                {isSendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Thực hiện</label>
                                    <select
                                        value={form.supporter_id}
                                        onChange={(e) => setForm({ ...form, supporter_id: e.target.value })}
                                        className={`w-full px-3 py-2 bg-[#ECFDF5] border border-[#D1FAE5] rounded-xl text-[13px] text-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 font-bold cursor-pointer hover:bg-[#D1FAE5] transition-colors ${shouldDisableTopFields() ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        disabled={shouldDisableTopFields()}
                                    >
                                        <option value="" className="text-slate-400 font-normal">+ Thêm người...</option>
                                        {assignableProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col sm:flex-row sm:items-start min-h-[40px] pt-2">
                                <div className="w-full sm:w-36 flex items-center gap-2 text-[11px] sm:text-sm font-semibold text-slate-500 uppercase tracking-wide sm:normal-case sm:tracking-normal shrink-0 mb-1 sm:mb-0 sm:mt-2">
                                    <AlignLeft size={16} className="hidden sm:block"/> Mô tả
                                </div>
                                <div className="flex-1 w-full relative group/desc">
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all min-h-[120px] resize-none shadow-sm"
                                        placeholder="Thêm mô tả chi tiết cho nhiệm vụ này..."
                                    />
                                    <div className="absolute right-3 bottom-3 flex gap-2">
                                        <button
                                            onClick={() => handleSpeechToText('description')}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${isListening === 'description' ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-200 hover:text-[#4F46E5] hover:border-[#4F46E5]'}`}
                                            title="Ghi âm mô tả"
                                        >
                                            {isListening === 'description' ? <MicOff size={16} /> : <Mic size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleAIRefine('description')}
                                            disabled={isRefining === 'description'}
                                            className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#4F46E5] hover:border-[#4F46E5] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all disabled:opacity-50"
                                            title="AI tinh chỉnh"
                                        >
                                            {isRefining === 'description' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-t border-slate-100 my-6" />

                            {/* Tabs Section */}
                            <div className="mt-8">
                                <div className="flex gap-4 sm:gap-6 border-b border-slate-200 mb-6 overflow-x-auto custom-scrollbar-hide">
                                    <button
                                        onClick={() => setActiveTab('subtasks')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap shrink-0 ${activeTab === 'subtasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <ListTodo size={16} /> Subtasks <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs ml-1">{subTasks.length}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('comments')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap shrink-0 ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <MessageSquare size={16} /> Comments
                                    </button>
                                    {/* Attachments Tab */}
                                    <button
                                        onClick={() => setActiveTab('links')}
                                        className={`flex items-center gap-1.5 pb-3 px-1 border-b-2 text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${activeTab === 'links'
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
                                                                                        value={st.assignee_id || ''}
                                                                                        onChange={(e) => updateSubTaskAssignee(st.id, e.target.value)}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="text-[10px] font-bold bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-300 cursor-pointer min-w-[80px] max-w-[100px] truncate appearance-none transition-colors"
                                                                                        title="Chỉ định người thực hiện"
                                                                                    >
                                                                                        <option value="">--</option>
                                                                                        {assignableProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
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
                                                    <div ref={subtaskInputRef} className="relative mt-4 flex items-center gap-2">
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
                    <div className="sticky bottom-0 z-20 px-4 sm:px-8 py-4 sm:py-5 bg-white border-t border-slate-100 flex gap-4 shrink-0 sm:rounded-b-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.03)] w-full">
                        {editingTask && form.status === 'Chờ duyệt' && ['Admin', 'Quản lý', 'Giám đốc'].includes(currentUserProfile?.role?.trim() || '') && (
                            currentUserProfile?.role === 'Admin' ||
                            currentUserProfile?.role === 'Quản lý' ||
                            projects.find(p => p.id === form.project_id)?.manager_id === currentUserProfile?.id ||
                            editingTask.assignee_id === currentUserProfile?.id
                        ) ? (
                            <>
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
                                    className="flex-1 py-3.5 bg-[#20B269] hover:bg-[#1a9356] text-white rounded-2xl text-[15px] font-bold tracking-wide shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    ✓ Duyệt
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3.5 bg-[#1B2132] hover:bg-black text-white rounded-2xl text-[15px] font-bold tracking-wide shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Lưu Lại
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="w-full py-3.5 bg-[#1B2132] hover:bg-black text-white rounded-2xl text-[15px] font-bold tracking-wide shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Lưu Lại
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>

            {/* Recursively render another AddEditTaskModal for deep-linking into subtasks */}
            {drilledSubtask && (
                <AddEditTaskModal
                    isOpen={!!drilledSubtask}
                    onClose={() => setDrilledSubtask(null)}
                    onSaved={() => {
                        setDrilledSubtask(null);
                        // Force subtasks refresh to get latest names/codes/statuses
                        if (editingTask?.id) {
                            supabase.from('tasks').select('*').eq('parent_id', editingTask.id).order('task_code', { ascending: true })
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
