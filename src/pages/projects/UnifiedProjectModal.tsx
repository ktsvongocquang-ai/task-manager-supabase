import React, { useState } from 'react';
import { type Project, type Task } from '../../types';
import { X, CheckSquare, Info, Clock, AlertCircle } from 'lucide-react';

import { ProjectTasksTab } from './ProjectTasksTab';
import { ProjectInfoTab } from './ProjectInfoTab';
import { ProjectTimelineTab } from './ProjectTimelineTab';

interface UnifiedProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    
    // Props for Tasks Tab
    tasks: Task[];
    profiles: any[];
    currentUserProfile: any;
    onToggleComplete: (task: Task) => void;
    onAddTask: (projectId: string) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onCopyTask: (task: Task) => void;
    onUpdateAssignee: (taskId: string, assigneeId: string) => void;

    // Props for Info Tab
    onSaveProject: (formData: any) => Promise<void>;
    form: any;
    setForm: (form: any) => void;

    // Props for Timeline Tab
    managerName?: string;
    onUpdateProjectStats?: () => void;

    initialTab?: 'tasks' | 'info' | 'timeline';
}

type TabType = 'tasks' | 'info' | 'timeline';

export const UnifiedProjectModal: React.FC<UnifiedProjectModalProps> = ({
    isOpen,
    onClose,
    project,
    
    // Tasks Props
    tasks,
    profiles,
    currentUserProfile,
    onToggleComplete,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onCopyTask,
    onUpdateAssignee,

    // Info Props
    onSaveProject,
    form,
    setForm,

    // Timeline Props
    managerName,
    onUpdateProjectStats,

    initialTab = 'tasks'
}) => {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    // Reset tab when project changes or modal opens
    React.useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab, project?.id]);

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-[9998]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md relative shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl shrink-0">
                                {project.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                                    {project.name}
                                </h2>
                                <p className="text-sm font-bold text-slate-400 mt-0.5">
                                    {project.project_code} • {project.project_type || 'Dự án'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Tab Switcher */}
                            <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1">
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <CheckSquare size={16} strokeWidth={2.5} />
                                    Nhiệm vụ
                                </button>
                                <button
                                    onClick={() => setActiveTab('timeline')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'timeline' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <Clock size={16} strokeWidth={2.5} />
                                    Tiến độ
                                </button>
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <Info size={16} strokeWidth={2.5} />
                                    Thông tin
                                </button>
                            </div>
                            
                            <div className="w-px h-8 bg-slate-200 mx-1"></div>

                            <button onClick={onClose} className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors bg-white shadow-sm border border-slate-100">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Tab Content Body */}
                    <div className="flex-1 overflow-hidden relative bg-[#F3F4F6]">
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'tasks' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <ProjectTasksTab 
                                isOpen={activeTab === 'tasks'}
                                onClose={onClose}
                                project={project}
                                tasks={tasks}
                                profiles={profiles}
                                currentUserProfile={currentUserProfile}
                                onToggleComplete={onToggleComplete}
                                onAddTask={onAddTask}
                                onEditTask={onEditTask}
                                onDeleteTask={onDeleteTask}
                                onCopyTask={onCopyTask}
                                onUpdateAssignee={onUpdateAssignee}
                            />
                        </div>
                        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'timeline' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <ProjectTimelineTab 
                                isOpen={activeTab === 'timeline'}
                                onClose={onClose}
                                project={project}
                                tasks={tasks}
                                managerName={managerName}
                                onUpdateProject={onUpdateProjectStats}
                            />
                        </div>
                        <div className={`absolute inset-0 transition-opacity duration-300 overflow-y-auto custom-scrollbar bg-white ${activeTab === 'info' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                            <ProjectInfoTab 
                                isOpen={activeTab === 'info'}
                                onClose={onClose}
                                onSave={onSaveProject}
                                editingProject={project}
                                form={form}
                                setForm={setForm}
                                profiles={profiles}
                                currentUserProfile={currentUserProfile}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
