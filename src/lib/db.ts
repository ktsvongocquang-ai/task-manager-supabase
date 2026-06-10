import { type FloorPlan, type MarkerNote, type WhiteboardAnnotation, type Project } from '../types/floorplan';
import { supabase } from '../services/supabase';

export async function saveProject(project: Project): Promise<void> {
  const dbPayload = {
    id: project.id,
    name: project.name,
    client: project.client || '',
    leader: project.leader || '',
    address: project.address || '',
    status: project.status || 'active',
    progress: project.progress || 0,
    created_at: project.createdAt
  };
  const { error } = await supabase.from('projects').upsert(dbPayload);
  if (error) throw error;
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  if (!data) return [];
  
  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    client: p.client,
    leader: p.leader,
    address: p.address,
    status: p.status,
    progress: p.progress,
    createdAt: Number(p.created_at)
  }));
}

export async function deleteProject(id: string): Promise<void> {
  // Cascading deletes aren't set up yet, so delete children first
  const { data: plans } = await supabase.from('floor_plans').select('id').eq('project_id', id);
  if (plans && plans.length > 0) {
    const planIds = plans.map(p => p.id);
    await supabase.from('marker_notes').delete().in('floor_plan_id', planIds);
    await supabase.from('whiteboard_annotations').delete().in('floor_plan_id', planIds);
    await supabase.from('floor_plans').delete().eq('project_id', id);
  }
  
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function saveFloorPlan(plan: FloorPlan): Promise<void> {
  const dbPayload = {
    id: plan.id,
    name: plan.name,
    image_data: plan.imageData || null,
    width: plan.width,
    height: plan.height,
    project_id: plan.projectId || null,
    plan_type: plan.planType || null,
    created_at: plan.createdAt,
    canvas_x: plan.canvasX || null,
    canvas_y: plan.canvasY || null,
    canvas_scale: plan.canvasScale || null,
    is_pinned: plan.isPinned || false,
    document_group_id: plan.documentGroupId || null,
    page_index: plan.pageIndex || null,
    page_count: plan.pageCount || null,
    pdf_data: plan.pdfData || null
  };
  const { error } = await supabase.from('floor_plans').upsert(dbPayload);
  if (error) throw error;
}

export async function getFloorPlans(): Promise<FloorPlan[]> {
  const { data, error } = await supabase
    .from('floor_plans')
    // Exclude pdf_data (can be a large JSON array of page URLs) — lazy-loaded when needed
    .select('id, name, image_data, width, height, project_id, plan_type, created_at, canvas_x, canvas_y, canvas_scale, is_pinned, document_group_id, page_index, page_count')
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  if (!data) return [];
  
  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    imageData: p.image_data,
    width: p.width,
    height: p.height,
    projectId: p.project_id,
    planType: p.plan_type,
    createdAt: Number(p.created_at),
    canvasX: p.canvas_x,
    canvasY: p.canvas_y,
    canvasScale: p.canvas_scale,
    isPinned: p.is_pinned,
    documentGroupId: p.document_group_id,
    pageIndex: p.page_index,
    pageCount: p.page_count,
    // pdfData intentionally excluded — fetched on-demand via getFloorPlanById
  }));
}

/** Lazy-load a single floor plan including the full pdf_data column.
 *  Only call this when the user actually opens a multi-page floor plan in PinMapView. */
export async function getFloorPlanById(id: string): Promise<FloorPlan | null> {
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    imageData: data.image_data,
    width: data.width,
    height: data.height,
    projectId: data.project_id,
    planType: data.plan_type,
    createdAt: Number(data.created_at),
    canvasX: data.canvas_x,
    canvasY: data.canvas_y,
    canvasScale: data.canvas_scale,
    isPinned: data.is_pinned,
    documentGroupId: data.document_group_id,
    pageIndex: data.page_index,
    pageCount: data.page_count,
    pdfData: data.pdf_data,
  };
}

export async function deleteFloorPlan(id: string): Promise<void> {
  // 1. Get the floor plan to know its storage URLs if we want to delete from bucket later,
  // but for now we just delete the DB record.
  
  // 2. Delete the DB record (cascading deletes aren't set up yet, so delete children first)
  await supabase.from('marker_notes').delete().eq('floor_plan_id', id);
  await supabase.from('whiteboard_annotations').delete().eq('floor_plan_id', id);
  
  const { error } = await supabase.from('floor_plans').delete().eq('id', id);
  if (error) throw error;
}

export async function saveMarkerNote(note: MarkerNote): Promise<void> {
  const dbPayload = {
    id: note.id,
    floor_plan_id: note.floorPlanId,
    x: note.x,
    y: note.y,
    title: note.title,
    description: note.description,
    status: note.tags?.[0] || 'Chưa sửa', // tags[0] is the status
    created_at: note.createdAt,
    author: note.author || null,
    priority: note.priority || 'medium',
    assigned_to: note.assignedTo || null,
    due_date: note.dueDate || null,
    images: note.images || null,
    tags: note.tags || null
  };
  const { error } = await supabase.from('marker_notes').upsert(dbPayload);
  if (error) throw error;
}

export async function getMarkerNotes(floorPlanId?: string): Promise<MarkerNote[]> {
  let query = supabase.from('marker_notes').select('*');
  if (floorPlanId) {
    query = query.eq('floor_plan_id', floorPlanId);
  }
  const { data, error } = await query;
  if (error) throw error;
  
  if (!data) return [];
  
  return data.map((m: any) => ({
    id: m.id,
    floorPlanId: m.floor_plan_id,
    x: m.x,
    y: m.y,
    title: m.title,
    description: m.description,
    status: m.status,
    createdAt: Number(m.created_at),
    author: m.author,
    priority: m.priority,
    assignedTo: m.assigned_to,
    dueDate: m.due_date ? Number(m.due_date) : undefined,
    images: m.images,
    tags: m.tags
  }));
}

export async function deleteMarkerNote(id: string): Promise<void> {
  const { error } = await supabase.from('marker_notes').delete().eq('id', id);
  if (error) throw error;
}

export async function saveAnnotation(annot: WhiteboardAnnotation): Promise<void> {
  const dbPayload: any = {
    id: annot.id,
    floor_plan_id: annot.floorPlanId,
    type: annot.type,
    x: annot.x,
    y: annot.y,
    width: annot.width,
    height: annot.height,
    color: annot.color,
    created_at: annot.createdAt,
    stroke_width: annot.strokeWidth || null,
    points: annot.points || null,
    text: annot.content || ''
  };

  const extraFields = {
    endX: annot.endX,
    endY: annot.endY,
    strokeDash: annot.strokeDash,
    lineType: annot.lineType,
    isLocked: annot.isLocked,
    opacity: annot.opacity,
    lineJump: annot.lineJump,
    zIndex: annot.zIndex,
    userName: annot.userName, // Not in DB schema
  };

  if (Object.values(extraFields).some(v => v !== undefined)) {
    dbPayload.text = dbPayload.text + '\n---META---\n' + JSON.stringify(extraFields);
  }

  const { error } = await supabase.from('whiteboard_annotations').upsert(dbPayload);
  if (error) {
    console.error("Supabase upsert error:", error);
    throw error;
  }
}

export async function getAnnotations(floorPlanId?: string): Promise<WhiteboardAnnotation[]> {
  let query = supabase.from('whiteboard_annotations').select('*');
  if (floorPlanId) {
    query = query.eq('floor_plan_id', floorPlanId);
  }
  const { data, error } = await query;
  if (error) throw error;
  
  if (!data) return [];

  return data.map(d => {
    const annot = { 
      id: d.id,
      floorPlanId: d.floor_plan_id,
      type: d.type,
      x: d.x,
      y: d.y,
      width: d.width,
      height: d.height,
      color: d.color,
      createdAt: Number(d.created_at),
      strokeWidth: d.stroke_width,
      points: d.points,
      content: d.text || '' 
    } as any;
    if (typeof annot.content === 'string' && annot.content.includes('\n---META---\n')) {
      const parts = annot.content.split('\n---META---\n');
      annot.content = parts[0];
      try {
        const meta = JSON.parse(parts[1]);
        Object.assign(annot, meta);
      } catch (e) {}
    }
    return annot as WhiteboardAnnotation;
  });
}

export async function deleteAnnotation(id: string): Promise<void> {
  const { error } = await supabase.from('whiteboard_annotations').delete().eq('id', id);
  if (error) throw error;
}
