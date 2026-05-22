import { supabase } from './supabase';

// ─── TYPES ───────────────────────────────────────────────────

export interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  module_id: string;
  slug: string | null;
  number: string;
  title: string;
  description: string | null;
  icon: string | null;
  content: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  subsections?: Subsection[];
}

export interface Subsection {
  id: string;
  section_id: string;
  slug: string | null;
  heading: string;
  content: string | null;
  content_type: 'text' | 'items' | 'table' | 'mistakes';
  metadata: Record<string, unknown> | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  module_id: string;
  slug: string | null;
  number: string;
  title: string;
  description: string | null;
  icon: string | null;
  lead_quote: string | null;
  checklist: string[] | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  phase: string;
  owner: string | null;
  actions: string[] | null;
  metadata: Record<string, unknown> | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

// ─── FETCH FUNCTIONS ─────────────────────────────────────────

/**
 * Get all training modules ordered by sort_order
 */
export async function fetchModules(): Promise<TrainingModule[]> {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching training modules:', error);
    return [];
  }
  return data || [];
}

/**
 * Update the metadata for a given subsection
 */
export async function updateSubsectionMetadata(subsectionId: string, newMetadata: any): Promise<boolean> {
  const { error } = await supabase
    .from('training_subsections')
    .update({ metadata: newMetadata })
    .eq('id', subsectionId);

  if (error) {
    console.error('Error updating subsection metadata:', error);
    return false;
  }
  return true;
}

/**
 * Get all sections for a given module, each with nested subsections
 */
export async function fetchSectionsForModule(moduleId: string): Promise<Section[]> {
  const { data: sections, error: sError } = await supabase
    .from('training_sections')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  if (sError) {
    console.error('Error fetching sections:', sError);
    return [];
  }
  if (!sections || sections.length === 0) return [];

  // Fetch all subsections for these sections in one query
  const sectionIds = sections.map(s => s.id);
  const { data: allSubsections, error: subError } = await supabase
    .from('training_subsections')
    .select('*')
    .in('section_id', sectionIds)
    .order('sort_order', { ascending: true });

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
 * Get all workflows for a given module
 */
export async function fetchWorkflows(moduleId: string): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from('training_workflows')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

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
    .from('training_workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (wError || !workflow) {
    console.error('Error fetching workflow:', wError);
    return null;
  }

  const { data: steps, error: stepsError } = await supabase
    .from('training_workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('sort_order', { ascending: true });

  if (stepsError) console.error('Error fetching workflow steps:', stepsError);

  return { ...workflow, steps: steps || [] };
}

/**
 * Search across sections and subsections
 */
export async function searchTrainingContent(query: string): Promise<{
  sections: Pick<Section, 'id' | 'module_id' | 'number' | 'title'>[];
  subsections: Pick<Subsection, 'id' | 'section_id' | 'heading'>[];
}> {
  if (!query.trim()) return { sections: [], subsections: [] };

  const searchTerm = `%${query}%`;

  const [sectionsRes, subsectionsRes] = await Promise.all([
    supabase
      .from('training_sections')
      .select('id, module_id, number, title')
      .ilike('title', searchTerm),
    supabase
      .from('training_subsections')
      .select('id, section_id, heading')
      .or(`heading.ilike.${searchTerm},content.ilike.${searchTerm}`),
  ]);

  return {
    sections: sectionsRes.data || [],
    subsections: subsectionsRes.data || [],
  };
}

/**
 * Upsert workflow step actions (for the coordination checklist)
 */
export async function updateWorkflowStepActions(workflowId: string, phase: string, actions: string[]): Promise<boolean> {
  // First, check if step exists
  const { data: existing } = await supabase
    .from('training_workflow_steps')
    .select('id')
    .eq('workflow_id', workflowId)
    .eq('phase', phase)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('training_workflow_steps')
      .update({ actions })
      .eq('id', existing.id);
    if (error) {
      console.error('Error updating step actions:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('training_workflow_steps')
      .insert({
        workflow_id: workflowId,
        phase,
        actions,
        sort_order: 1 // Default
      });
    if (error) {
      console.error('Error inserting step actions:', error);
      return false;
    }
  }
  return true;
}

/**
 * Update workflow checklist
 */
export async function updateWorkflowChecklist(workflowId: string, checklist: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('training_workflows')
    .update({ checklist })
    .eq('id', workflowId);
  if (error) {
    console.error('Error updating workflow checklist:', error);
    return false;
  }
  return true;
}

/**
 * Update workflow step metadata (e.g. docs)
 */
export async function updateWorkflowStepMetadata(stepId: string, metadata: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase
    .from('training_workflow_steps')
    .update({ metadata })
    .eq('id', stepId);
  if (error) {
    console.error('Error updating step metadata:', error);
    return false;
  }
  return true;
}
