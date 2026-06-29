import { Task, Project } from '../types';

/**
 * Determines if a task is actually a "Level 2 Project" (Mục lớn Cấp 2 / Công trình thi công)
 * Level 2 Projects act as containers for real tasks in Construction and Rollup projects.
 * They should generally be hidden from global task views like Kanban, Tasks, and Schedule.
 */
export const isLevel2ProjectTask = (task: Task, projects: Project[]): boolean => {
    // If it has a parent, it's a subtask (a real task inside a Level 2 Project or normal project)
    if (task.parent_id) return false;

    // Find the associated project
    const project = projects.find(p => p.id === task.project_id);
    if (!project) return false;

    // Check if the project is a "Rollup Project" (Thi công or Tổng hợp)
    const isRollup = project.status === 'Thi công' || (project.name || '').toLowerCase().includes('tổng hợp');
    
    // In a rollup project, top-level tasks (no parent) are Level 2 Projects
    return isRollup;
};

/**
 * Enriches tasks by formatting their task_code if they are subtasks of a Level 2 project.
 * It changes the display to: [ProjectCode]-[TaskNum]-[PhaseName]
 */
export const enrichTasks = (tasks: Task[], projects: Project[]): Task[] => {
    return tasks.map(task => {
        if (task.parent_id) {
            const project = projects.find(p => p.id === task.project_id);
            const isRollup = project?.status === 'Thi công' || (project?.name || '').toLowerCase().includes('tổng hợp');
            if (isRollup) {
                const parentTask = tasks.find(pt => pt.id === task.parent_id);
                if (parentTask) {
                    let phaseName = parentTask.name || '';
                    if (phaseName.toUpperCase().startsWith('HSTC-')) phaseName = phaseName.substring(5).trim();
                    const match = (task.task_code || '').match(/(\d+)$/);
                    const taskNum = match ? match[1].padStart(2, '0') : task.task_code;
                    const projCode = project.project_code || '';
                    return { ...task, task_code: `${projCode}-${taskNum}-${phaseName}` };
                }
            }
        }
        return task;
    });
};
