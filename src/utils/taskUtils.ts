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
        const project = projects.find(p => p.id === task.project_id);
        if (!project) return task;

        const isRollup = project.status === 'Thi công' || (project.name || '').toLowerCase().includes('tổng hợp');
        
        if (isRollup && task.parent_id) {
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
        return task;
    });
};

/**
 * Formats task_code to ensure it remains a clean, concise code string (e.g., DA001-01)
 * Strips out messy appended project names or raw negative IDs like "-1460" or "-Villa Ms Trang".
 */
export const formatCleanTaskCode = (code: string | null | undefined): string => {
    if (!code) return '';
    let clean = code.trim();

    // Strip trailing project name suffixes appended via dashes, e.g., "DQH-003-Villa Ms Trang" -> "DQH-003"
    // Also handle raw negative ID strings or messy prefixes
    clean = clean.replace(/^[-\s]+/, ''); // remove leading dashes/spaces
    if (clean.includes('-')) {
        const parts = clean.split('-');
        // If second part is just numeric code, keep code part e.g. "DQH-003"
        if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
            return `${parts[0]}-${parts[1]}`;
        }
        // If first part is alpha-numeric code, return it
        if (/^[A-Z0-9]+$/i.test(parts[0])) {
            return parts[0];
        }
    }
    // If it's pure numbers, e.g. "1460", hide or format nicely
    if (/^\d+$/.test(clean)) {
        return `#${clean.slice(-4)}`;
    }
    return clean;
};

/**
 * Cleans up and standardizes task title formatting across the entire app:
 * - Strips leading dashes (- ), asterisks (* ), bullets (• ), dots (.) and leading whitespace
 * - Capitalizes the first letter cleanly
 * - Cleans up typos like "KHối Lượng" -> "Khối lượng"
 */
export const formatCleanTaskTitle = (name: string | null | undefined): string => {
    if (!name) return 'Chưa có tên';
    let clean = name.trim();

    // Strip leading prefix like "HSTC- ", "HSTC_", "- ", "* ", "• ", "."
    clean = clean.replace(/^(HSTC[-\s_]*)/i, '').replace(/^[-\*•\.\s]+/, '').trim();
    if (!clean) return name;

    // If text is ALL UPPERCASE (e.g. "MY HOUSE DAK LAK"), convert to Title Case ("My House Dak Lak")
    if (clean === clean.toUpperCase() && clean.length > 3) {
        clean = clean.split(' ').map(word => {
            if (!word) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    } else {
        // Capitalize first letter of sentence cleanly
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    // Clean up internal typos like "KHối Lượng" -> "Khối lượng"
    clean = clean.replace(/KHối/gi, 'Khối').replace(/Lượng/gi, 'lượng');

    return clean;
};
