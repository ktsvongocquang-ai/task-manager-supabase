import React, { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { type Project } from '../../types';

// Lazy-loaded: these pull in @hello-pangea/dnd + comment UI, only needed once
// someone actually opens "Thêm nhanh" - shouldn't ship in every page's main bundle.
const AddEditProjectModal = lazy(() =>
    import('../../pages/projects/AddEditProjectModal').then(m => ({ default: m.AddEditProjectModal }))
);
const AddEditTaskModal = lazy(() =>
    import('../../pages/tasks/AddEditTaskModal').then(m => ({ default: m.AddEditTaskModal }))
);

interface GlobalModalsProps {
    isProjectModalOpen: boolean;
    isTaskModalOpen: boolean;
    onCloseProjectModal: () => void;
    onCloseTaskModal: () => void;
}

export const GlobalModals: React.FC<GlobalModalsProps> = ({
    isProjectModalOpen,
    isTaskModalOpen,
    onCloseProjectModal,
    onCloseTaskModal
}) => {
    const { profile } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [editingTask, setEditingTask] = useState<any>(null);

    // Project Form State
    const [projectForm, setProjectForm] = useState({
        name: '', project_code: '', description: '', status: 'Chưa bắt đầu',
        start_date: '', end_date: '', manager_id: '', budget: 0
    });

    // Task Form State
    const [taskModalInitialData] = useState({ task_code: '', project_id: '' });

    // Fetch dependencies when any modal opens
    useEffect(() => {
        if (isProjectModalOpen || isTaskModalOpen || editingTask) {
            fetchProfiles();
            if (isTaskModalOpen || editingTask) {
                fetchProjects();
            } else if (isProjectModalOpen && projects.length === 0) {
                // For generating next project code
                fetchProjects();
            }
        }
    }, [isProjectModalOpen, isTaskModalOpen, editingTask]);

    // Handle global event to open task from chat
    useEffect(() => {
        const handleOpenTask = async (e: any) => {
            const taskId = e.detail;
            if (!taskId) return;
            const { data } = await supabase.from('tasks').select('*').eq('id', taskId).single();
            if (data) {
                setEditingTask(data);
            }
        };
        window.addEventListener('openChatTask', handleOpenTask);
        return () => window.removeEventListener('openChatTask', handleOpenTask);
    }, []);

    useEffect(() => {
        if (isProjectModalOpen && projects.length > 0) {
            setProjectForm({
                name: '', project_code: generateNextProjectCode(),
                description: '', status: 'Chưa bắt đầu', start_date: '', end_date: '',
                manager_id: profile?.id || '', budget: 0
            });
        }
    }, [isProjectModalOpen, projects]);

    const fetchProjects = async () => {
        const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (data) setProjects(data as Project[]);
    };

    const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name, role, email');
        if (data) setProfiles(data);
    };

    const generateNextProjectCode = () => {
        let maxId = 0;
        projects.forEach(p => {
            const match = p.project_code.match(/^DA(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        return `DA${String(maxId + 1).padStart(3, '0')}`;
    };

    const handleSaveProject = async (formData: any) => {
        try {
            const { budget: _budget, ...payloadData } = formData;
            const payload = {
                ...payloadData,
                manager_id: payloadData.manager_id || null,
                description: payloadData.description || null,
                start_date: payloadData.start_date || null,
                end_date: payloadData.end_date || null
            };

            const result = await supabase.from('projects').insert(payload);

            if (result.error) {
                alert(`Lỗi lưu dự án: ${result.error.message}`);
                return;
            }

            onCloseProjectModal();
            // Force reload current view to see new project if on /projects
            if (window.location.pathname === '/projects') {
                window.location.reload();
            }
        } catch (err) {
            console.error('Global Add Project Error:', err);
        }
    };

    return (
        <>
            {/* Global Project Modal - only mounted (and its chunk fetched) once actually opened */}
            {isProjectModalOpen && (
                <Suspense fallback={null}>
                    <AddEditProjectModal
                        isOpen={isProjectModalOpen}
                        onClose={onCloseProjectModal}
                        onSave={handleSaveProject}
                        editingProject={null}
                        form={projectForm}
                        setForm={setProjectForm}
                        profiles={profiles}
                        currentUserProfile={profile}
                    />
                </Suspense>
            )}

            {/* Global Task Modal - only mounted (and its chunk fetched) once actually opened */}
            {isTaskModalOpen && (
                <Suspense fallback={null}>
                    <AddEditTaskModal
                        isOpen={isTaskModalOpen}
                        onClose={onCloseTaskModal}
                        onSaved={() => {
                            onCloseTaskModal();
                            if (window.location.pathname === '/tasks' || window.location.pathname === '/kanban') {
                                window.location.reload();
                            }
                        }}
                        editingTask={null}
                        initialData={taskModalInitialData}
                        projects={projects}
                        profiles={profiles}
                        currentUserProfile={profile}
                    />
                </Suspense>
            )}

            {/* Global Edit Task Modal from Chat */}
            {editingTask && (
                <Suspense fallback={null}>
                    <AddEditTaskModal
                        isOpen={!!editingTask}
                        onClose={() => setEditingTask(null)}
                        onSaved={() => {
                            setEditingTask(null);
                            if (window.location.pathname === '/tasks' || window.location.pathname === '/kanban') {
                                window.location.reload();
                            }
                        }}
                        editingTask={editingTask}
                        initialData={taskModalInitialData}
                        projects={projects}
                        profiles={profiles}
                        currentUserProfile={profile}
                        onDeleteTask={async (task) => {
                            if (!confirm('Bạn có chắc muốn xóa công việc này? Hành động này không thể hoàn tác.')) return;
                            await supabase.from('tasks').delete().eq('id', task.id);
                            setEditingTask(null);
                        }}
                    />
                </Suspense>
            )}
        </>
    );
};
