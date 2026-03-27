import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';

// Helper custom types mapping the schema
export interface SupabaseProject {
  id: string;
  name: string;
  address: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  start_date: string;
  created_at: string;
}

export interface SupabaseTask {
  id: string;
  project_id: string;
  name: string;
  category: string;
  status: string;
  budget: number;
  spent: number;
  progress: number;
  dependencies: string[];
  checklist: any[];
  issues: any[];
  days: number;
}

export interface SupabaseDailyLog {
  id: string;
  project_id: string;
  date: string;
  weather_morning: string;
  temperature: number;
  notes: string;
  photo_urls: string[]; // Mocking image handling if DB lacks strict array, jsonb fallback
  created_at: string;
}

export const useConstructionData = () => {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [tasks, setTasks] = useState<SupabaseTask[]>([]);
  const [logs, setLogs] = useState<SupabaseDailyLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync methods
  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('construction_projects').select('*').order('created_at', { ascending: false });
    if (pData) setProjects(pData as any);
    setLoading(false);
  }, []);

  const loadProjectDetails = useCallback(async (projectId: string) => {
    setLoading(true);
    const { data: tData } = await supabase.from('construction_tasks').select('*').eq('project_id', projectId);
    const { data: lData } = await supabase.from('daily_logs').select('*').eq('project_id', projectId).order('date', { ascending: false });
    
    if (tData) setTasks(tData as any);
    if (lData) setLogs(lData as any);
    setLoading(false);
  }, []);

  // Creations
  const createProject = async (project: Partial<SupabaseProject>): Promise<string | null> => {
    const { data, error } = await supabase.from('construction_projects').insert([project]).select('id').single();
    if (error) { console.error("Create Project error:", error); return null; }
    await loadProjects();
    return data?.id;
  };

  const createTimelineTasks = async (projectId: string, newTasks: any[]) => {
    // Note: since dependencies are returned as indices by AI, we map them to real UUIDs
    try {
      // First insert sequentially or insert all and update dependencies.
      // Easiest is to generate uuids frontend side, map dependencies, then push bulk.
      const mapped = newTasks.map(t => ({
        id: crypto.randomUUID(),
        project_id: projectId,
        name: t.name,
        category: t.category,
        budget: t.budget,
        days: t.days,
        status: 'TODO',
        checklist: t.checklist.map((c: string) => ({ text: c, completed: false })),
        dependencies: [] // We resolve them next
      }));

      newTasks.forEach((original, idx) => {
          mapped[idx].dependencies = original.dependencies.map((depIndex: number) => mapped[depIndex]?.id).filter(Boolean);
      });

      const { error } = await supabase.from('construction_tasks').insert(mapped);
      if (error) throw error;
      
      await loadProjectDetails(projectId);
      return true;
    } catch(e) {
      console.error("Bulk Insert Tasks Error:", e);
      return false;
    }
  };

  const updateTaskStatusChecklist = async (taskId: string, status: string, checklist: any[], issues: any[] = []) => {
    const { error } = await supabase.from('construction_tasks')
      .update({ status, checklist, issues })
      .eq('id', taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, checklist, issues } : t));
    }
    return !error;
  };

  const submitDailyLog = async (logData: Partial<SupabaseDailyLog>) => {
    const { error } = await supabase.from('daily_logs').insert([logData]);
    if (!error && logData.project_id) {
      await loadProjectDetails(logData.project_id);
    }
    return !error;
  };

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    tasks,
    logs,
    loading,
    loadProjects,
    loadProjectDetails,
    createProject,
    createTimelineTasks,
    updateTaskStatusChecklist,
    submitDailyLog
  };
};
