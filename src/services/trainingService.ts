import { supabase } from './supabase';

// ─── TYPES ───────────────────────────────────────────────────

export interface TrainingModule {
  id: string;
  module_number: number;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  module_id: string;
  section_number: string;
  title: string;
  content: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
  subsections?: Subsection[];
}

export interface Subsection {
  id: string;
  section_id: string;
  title: string;
  content: string | null;
  content_type: 'text' | 'list' | 'table' | 'code' | 'mistakes';
  metadata: Record<string, unknown> | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  module_id: string;
  workflow_number: number;
  title: string;
  description: string | null;
  icon: string | null;
  owner: string | null;
  duration: string | null;
  lead_quote: string | null;
  checklist: string[] | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  phase: string;
  owner: string | null;
  actions: string[] | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface LearningResource {
  id: string;
  module_id: string | null;
  section_id: string | null;
  title: string;
  resource_type: string | null;
  url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ─── FETCH FUNCTIONS ─────────────────────────────────────────

/**
 * Get all training modules ordered by order_index
 */
export async function fetchModules(): Promise<TrainingModule[]> {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching training modules:', error);
    return [];
  }
  return data || [];
}

/**
 * Get all sections for a given module, each with nested subsections
 */
export async function fetchSectionsForModule(moduleId: string): Promise<Section[]> {
  const { data: sections, error: sError } = await supabase
    .from('sections')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });

  if (sError) {
    console.error('Error fetching sections:', sError);
    return [];
  }
  if (!sections || sections.length === 0) return [];

  // Fetch all subsections for these sections in one query
  const sectionIds = sections.map(s => s.id);
  const { data: allSubsections, error: subError } = await supabase
    .from('subsections')
    .select('*')
    .in('section_id', sectionIds)
    .order('order_index', { ascending: true });

  if (subError) {
    console.error('Error fetching subsections:', subError);
  }

  // Group subsections by section_id
  const subMap = new Map<string, Subsection[]>();
  (allSubsections || []).forEach(sub => {
    const list = subMap.get(sub.section_id) || [];
    list.push(sub);
    subMap.set(sub.section_id, list);
  });

  return sections.map(section => ({
    ...section,
    subsections: subMap.get(section.id) || [],
  }));
}

/**
 * Get a single section with its subsections
 */
export async function fetchSectionWithSubsections(sectionId: string): Promise<Section | null> {
  const { data: section, error: sError } = await supabase
    .from('sections')
    .select('*')
    .eq('id', sectionId)
    .single();

  if (sError || !section) {
    console.error('Error fetching section:', sError);
    return null;
  }

  const { data: subsections, error: subError } = await supabase
    .from('subsections')
    .select('*')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true });

  if (subError) console.error('Error fetching subsections:', subError);

  return { ...section, subsections: subsections || [] };
}

/**
 * Get all workflows for a given module
 */
export async function fetchWorkflows(moduleId: string): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching workflows:', error);
    return [];
  }
  return data || [];
}

/**
 * Get a single workflow with all its steps
 */
export async function fetchWorkflowWithSteps(workflowId: string): Promise<Workflow | null> {
  const { data: workflow, error: wError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (wError || !workflow) {
    console.error('Error fetching workflow:', wError);
    return null;
  }

  const { data: steps, error: stepsError } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('step_number', { ascending: true });

  if (stepsError) console.error('Error fetching workflow steps:', stepsError);

  return { ...workflow, steps: steps || [] };
}

/**
 * Search across sections and subsections
 */
export async function searchTrainingContent(query: string): Promise<{
  sections: Pick<Section, 'id' | 'module_id' | 'section_number' | 'title'>[];
  subsections: Pick<Subsection, 'id' | 'section_id' | 'title'>[];
}> {
  if (!query.trim()) return { sections: [], subsections: [] };

  const searchTerm = `%${query}%`;

  const [sectionsRes, subsectionsRes] = await Promise.all([
    supabase
      .from('sections')
      .select('id, module_id, section_number, title')
      .ilike('title', searchTerm),
    supabase
      .from('subsections')
      .select('id, section_id, title')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`),
  ]);

  return {
    sections: sectionsRes.data || [],
    subsections: subsectionsRes.data || [],
  };
}
