import { create } from 'zustand';
import { addDays, differenceInDays, parseISO, format, isAfter, startOfDay } from 'date-fns';
import type { CTask, TaskStatus } from './types';

interface ProjectStore {
  tasks: CTask[];
  currentTime: Date;
  selectedTaskId: string | null;
  dailyBriefingMode: 'morning' | 'evening' | null;
  
  // Actions
  setTasks: (tasks: CTask[]) => void;
  addTask: (task: Partial<CTask>) => void;
  updateTask: (id: string, updates: Partial<CTask>) => void;
  uploadPDFMock: () => void;
  tickTime: (hours: number) => void;
  
  // Gantt interactions
  moveTaskDates: (id: string, daysDelta: number) => void;
  resizeTaskDuration: (id: string, durationDelta: number, direction: 'left' | 'right') => void;
  
  // Kanban interactions
  moveTaskStatus: (id: string, status: TaskStatus) => void;
  
  // AI Actions
  applyAiAction: (id: string, actionType: 'WORKERS' | 'SPLIT' | 'DELAY') => void;
  
  // Modals
  setSelectedTask: (id: string | null) => void;
  setDailyBriefingMode: (mode: 'morning' | 'evening' | null) => void;
  approveAllEveningTasks: () => void;
}

const mockMacroTasks: CTask[] = [
  { id: 'm1', name: 'Ép cọc ly tâm', category: 'Thi công', status: 'TODO', subcontractor: 'Nền Móng VN', days: 5, budget: 150, spent: 0, approved: false, dependencies: [], tags: [], issues: [], checklist: [], progress: 0, 
    plannedStart: format(new Date(), 'yyyy-MM-dd'), plannedEnd: format(addDays(new Date(), 5), 'yyyy-MM-dd'), duration: 5, taskLevel: 'macro', requiredWorkers: 10, isExtra: false },
  { id: 'm2', name: 'Đổ bê tông Lót', category: 'Thi công', status: 'TODO', subcontractor: 'Phụ hồ 1', days: 2, budget: 50, spent: 0, approved: false, dependencies: ['m1'], tags: [], issues: [], checklist: [], progress: 0, 
    plannedStart: format(addDays(new Date(), 6), 'yyyy-MM-dd'), plannedEnd: format(addDays(new Date(), 7), 'yyyy-MM-dd'), duration: 2, taskLevel: 'macro', requiredWorkers: 5, isExtra: false },
  { id: 'm3', name: 'Gia công thép móng (Phát sinh)', category: 'Vật tư', status: 'TODO', subcontractor: 'Thép Vina', days: 3, budget: 100, spent: 0, approved: false, dependencies: ['m2'], tags: [], issues: [], checklist: [], progress: 0, 
    plannedStart: format(addDays(new Date(), 8), 'yyyy-MM-dd'), plannedEnd: format(addDays(new Date(), 10), 'yyyy-MM-dd'), duration: 3, taskLevel: 'macro', requiredWorkers: 4, isExtra: true },
];

export const useProjectStore = create<ProjectStore>((set, get) => ({
  tasks: [],
  currentTime: new Date(),
  selectedTaskId: null,
  dailyBriefingMode: null,

  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, { ...task, id: `t_${Date.now()}` } as CTask] 
  })),

  updateTask: (id, updates) => set((state) => {
    return {
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    };
  }),

  uploadPDFMock: () => set((state) => ({
    // Uploading PDF auto-generates macro tasks
    tasks: [...state.tasks, ...mockMacroTasks]
  })),

  tickTime: (hours) => set((state) => {
    const newTime = new Date(state.currentTime.getTime() + hours * 3600000);
    // Auto-update isOverdue based on time
    const updatedTasks = state.tasks.map(t => {
      if (!t.plannedEnd || t.status === 'DONE') return t;
      const isOverdue = isAfter(startOfDay(newTime), startOfDay(parseISO(t.plannedEnd)));
      return { ...t, isOverdue };
    });
    return { currentTime: newTime, tasks: updatedTasks };
  }),

  // MODULE 2: Interactive Gantt Drop Interactions
  moveTaskDates: (id, daysDelta) => set((state) => {
    let tasksCopy = [...state.tasks];
    
    const shiftTask = (taskId: string, delta: number) => {
      const taskIndex = tasksCopy.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;
      
      const t = tasksCopy[taskIndex];
      if (t.plannedStart && t.plannedEnd) {
        const newStart = addDays(parseISO(t.plannedStart), delta);
        const newEnd = addDays(parseISO(t.plannedEnd), delta);
        tasksCopy[taskIndex] = { ...t, plannedStart: format(newStart, 'yyyy-MM-dd'), plannedEnd: format(newEnd, 'yyyy-MM-dd') };
      }
      
      // Shift downstream dependencies
      tasksCopy.filter(child => child.dependencies?.includes(taskId)).forEach(child => {
        shiftTask(child.id, delta);
      });
    };
    
    shiftTask(id, daysDelta);
    return { tasks: tasksCopy };
  }),

  resizeTaskDuration: (id, durationDelta, direction) => set((state) => {
    const tasksCopy = [...state.tasks];
    const taskIndex = tasksCopy.findIndex(t => t.id === id);
    if (taskIndex === -1) return { tasks: state.tasks };
    
    const t = tasksCopy[taskIndex];
    if (t.plannedStart && t.plannedEnd) {
      if (direction === 'right') {
        const newEnd = addDays(parseISO(t.plannedEnd), durationDelta);
        tasksCopy[taskIndex] = { 
          ...t, 
          plannedEnd: format(newEnd, 'yyyy-MM-dd'), 
          duration: (t.duration || 1) + durationDelta 
        };
      } else if (direction === 'left') {
        const newStart = addDays(parseISO(t.plannedStart), -durationDelta); // negative delta means drag left
        tasksCopy[taskIndex] = { 
          ...t, 
          plannedStart: format(newStart, 'yyyy-MM-dd'), 
          duration: (t.duration || 1) + durationDelta
        };
      }
    }
    return { tasks: tasksCopy };
  }),

  moveTaskStatus: (id, newStatus) => set((state) => {
    return {
      tasks: state.tasks.map(t => {
        if (t.id === id) {
          // If task isOverdue, block moving to DONE unless solved
          if (t.isOverdue && newStatus === 'DONE') return t;
          return { ...t, status: newStatus };
        }
        return t;
      })
    };
  }),

  // MODULE 4: AI ACTIONS
  applyAiAction: (id, actionType) => set((state) => {
    let tasksCopy = [...state.tasks];
    const taskIndex = tasksCopy.findIndex(t => t.id === id);
    if (taskIndex === -1) return { tasks: state.tasks };
    
    const t = tasksCopy[taskIndex];
    
    if (actionType === 'WORKERS') {
      tasksCopy[taskIndex] = { ...t, requiredWorkers: Math.ceil((t.requiredWorkers || 1) * 1.5), isOverdue: false, status: 'DOING' };
    } 
    else if (actionType === 'SPLIT') {
      const splitTask: CTask = {
        ...t,
        id: t.id + '_split',
        name: t.name + ' (Phần tách)',
        plannedStart: state.currentTime.toISOString(), // Start now
        status: 'TODO',
        isOverdue: false
      };
      tasksCopy[taskIndex] = { ...t, isOverdue: false, status: 'DOING' };
      tasksCopy.push(splitTask);
    }
    else if (actionType === 'DELAY') {
      // Delay by 3 days
      const newEnd = addDays(parseISO(t.plannedEnd || new Date().toISOString()), 3);
      tasksCopy[taskIndex] = { ...t, plannedEnd: format(newEnd, 'yyyy-MM-dd'), isOverdue: false, status: 'DOING', duration: (t.duration || 1) + 3 };
      
      // Also shift dependencies
      const shiftDeps = (parentId: string, delta: number) => {
        tasksCopy.filter(child => child.dependencies?.includes(parentId)).forEach(child => {
            const cIndex = tasksCopy.findIndex(x => x.id === child.id);
            if (cIndex === -1) return;
            const c = tasksCopy[cIndex];
            if (c.plannedStart && c.plannedEnd) {
                tasksCopy[cIndex] = {
                    ...c,
                    plannedStart: format(addDays(parseISO(c.plannedStart), delta), 'yyyy-MM-dd'),
                    plannedEnd: format(addDays(parseISO(c.plannedEnd), delta), 'yyyy-MM-dd')
                };
                shiftDeps(c.id, delta);
            }
        });
      };
      shiftDeps(id, 3);
    }
    return { tasks: tasksCopy, selectedTaskId: null };
  }),

  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setDailyBriefingMode: (mode) => set({ dailyBriefingMode: mode }),

  approveAllEveningTasks: () => set((state) => ({
    tasks: state.tasks.map(t => t.status === 'REVIEW' ? { ...t, status: 'DONE', isOverdue: false } : t),
    dailyBriefingMode: null
  }))
}));
