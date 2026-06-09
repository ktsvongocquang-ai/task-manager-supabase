import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FloorPlan, MarkerNote, WhiteboardAnnotation, Project } from '../types';

let supabaseInstance: SupabaseClient | null = null;

// Credentials can be loaded dynamically from localStorage so the user can easily
// configure their own Supabase keys in the UI without modifying target code or env!
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  try {
    const stored = localStorage.getItem('dqh_supabase_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading Supabase config', e);
  }
  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig | null) {
  if (config) {
    localStorage.setItem('dqh_supabase_config', JSON.stringify(config));
    supabaseInstance = null; // Reset to force re-initialization
  } else {
    localStorage.removeItem('dqh_supabase_config');
    supabaseInstance = null;
  }
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const config = getSupabaseConfig();
  const metaEnv = (import.meta as any).env || {};
  const url = config?.url || metaEnv.VITE_SUPABASE_URL || '';
  const anonKey = config?.anonKey || metaEnv.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  const metaEnv = (import.meta as any).env || {};
  const url = config?.url || metaEnv.VITE_SUPABASE_URL || '';
  const anonKey = config?.anonKey || metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: { persistSession: false }
      });
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

/**
 * SQL queries to run inside Supabase SQL Editor for 1-click database initialization
 */
export const SUPABASE_SQL_SETUP = `-- DQH Architects - SQL Khởi Tạo Database Toàn Diện
-- Chạy đoạn mã này trong "SQL Editor" tại Supabase để CẬP NHẬT/TẠO MỚI các bảng

-- 0. Xóa các bảng cũ nếu có (Vì bạn chưa có dữ liệu quan trọng, việc xóa sẽ giúp tạo lại cấu trúc chuẩn nhất)
DROP TABLE IF EXISTS whiteboard_annotations CASCADE;
DROP TABLE IF EXISTS marker_notes CASCADE;
DROP TABLE IF EXISTS floor_plans CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 1. Bảng Dự Án (Projects)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT,
  leader TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL
);

-- 2. Bảng Mặt bằng Bản vẽ (Floor Plans)
CREATE TABLE floor_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_data TEXT, 
  width REAL DEFAULT 1000,
  height REAL DEFAULT 700,
  project_id TEXT,
  plan_type TEXT,
  created_at BIGINT NOT NULL,
  canvas_x REAL,
  canvas_y REAL,
  canvas_scale REAL,
  is_pinned BOOLEAN DEFAULT false,
  document_group_id TEXT,
  page_index INTEGER,
  page_count INTEGER,
  pdf_data TEXT
);

-- 3. Bảng Điểm Ghim Lỗi (Marker Notes)
CREATE TABLE marker_notes (
  id TEXT PRIMARY KEY,
  floor_plan_id TEXT NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  x REAL NOT NULL,
  y REAL NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at BIGINT NOT NULL,
  author TEXT,
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  due_date BIGINT,
  images JSONB,
  tags JSONB
);

-- 4. Bảng Nhãn Vẽ Whiteboard (Whiteboard Annotations)
CREATE TABLE whiteboard_annotations (
  id TEXT PRIMARY KEY,
  floor_plan_id TEXT NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL,
  height REAL,
  color TEXT,
  created_at BIGINT NOT NULL,
  stroke_width REAL,
  points JSONB,
  text TEXT
);

-- Kích hoạt quyền truy cập công khai không giới hạn (vận hành miễn phí)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE marker_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_annotations DISABLE ROW LEVEL SECURITY;

-- 5. Cấu hình Kho lưu trữ File (Storage Bucket) cho Bản vẽ & Ảnh
-- Tự động tạo bucket 'blueprints' nếu chưa có, giới hạn file 150MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blueprints', 'blueprints', true, 157286400, '{image/*,application/pdf}')
ON CONFLICT (id) DO UPDATE SET 
  public = true, 
  file_size_limit = 157286400,
  allowed_mime_types = '{image/*,application/pdf}';

-- Bật RLS cho storage objects nhưng tạo Policy cho phép đọc/ghi tự do
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'blueprints') WITH CHECK (bucket_id = 'blueprints');
`;

/**
 * Cloud database sync commands
 */
export async function syncLocalToSupabase(
  projects: Project[],
  plans: FloorPlan[],
  markers: MarkerNote[],
  annots: WhiteboardAnnotation[]
): Promise<{ success: boolean; message: string; count: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase không được cấu hình hoặc thiếu API Key hợp lệ.', count: 0 };
  }

  try {
    let syncedCount = 0;

    // 0. Sync projects
    for (const proj of projects) {
      const { error } = await client.from('projects').upsert({
        id: proj.id,
        name: proj.name,
        client: proj.client || '',
        leader: proj.leader || '',
        address: proj.address || '',
        status: proj.status || 'active',
        progress: proj.progress || 0,
        created_at: proj.createdAt
      });
      if (error) throw error;
      syncedCount++;
    }

    // 1. Sync plans
    for (const plan of plans) {
      const { error } = await client.from('floor_plans').upsert({
        id: plan.id,
        name: plan.name,
        image_data: plan.imageData || null,
        width: plan.width,
        height: plan.height,
        project_id: plan.projectId || null,
        plan_type: plan.planType || null,
        created_at: plan.createdAt
      });
      if (error) throw error;
      syncedCount++;
    }

    // 2. Sync marker notes
    for (const marker of markers) {
      const { error } = await client.from('marker_notes').upsert({
        id: marker.id,
        floor_plan_id: marker.floorPlanId,
        x: marker.x,
        y: marker.y,
        title: marker.title,
        photo_data: marker.photoData || null,
        audio_data: marker.audioData || null,
        transcription: marker.transcription || null,
        text_notes: marker.textNotes || null,
        comments: marker.comments || [],
        tags: marker.tags || [],
        created_at: marker.createdAt
      });
      if (error) throw error;
      syncedCount++;
    }

    // 3. Sync annotations
    for (const annot of annots) {
      const { error } = await client.from('whiteboard_annotations').upsert({
        id: annot.id,
        floor_plan_id: annot.floorPlanId,
        type: annot.type,
        x: annot.x,
        y: annot.y,
        width: annot.width || null,
        height: annot.height || null,
        color: annot.color || null,
        content: annot.content || '',
        user_name: annot.userName || '',
        comments: annot.comments || [],
        created_at: annot.createdAt
      });
      if (error) throw error;
      syncedCount++;
    }

    return {
      success: true,
      message: `Đồng bộ thành công! Đã đẩy ${syncedCount} bản ghi lên máy chủ Supabase.`,
      count: syncedCount
    };
  } catch (err: any) {
    console.error('Supabase Sync Error:', err);
    return { 
      success: false, 
      message: `Lỗi đồng bộ: ${err.message || err}. Hãy bảo đảm bạn đã tạo đầy đủ các bảng thông qua mã SQL Setup.`, 
      count: 0 
    };
  }
}

/**
 * Direct selective cloud pulling
 */
export async function pullFromSupabase(): Promise<{
  success: boolean;
  projects: Project[];
  plans: FloorPlan[];
  markers: MarkerNote[];
  annots: WhiteboardAnnotation[];
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, projects: [], plans: [], markers: [], annots: [], message: 'Supabase chưa được cấu hình.' };
  }

  try {
    // Pull Projects
    const { data: projectsData, error: projectsErr } = await client.from('projects').select('*');
    if (projectsErr) throw projectsErr;

    // Pull Floor plans
    const { data: plansData, error: plansErr } = await client.from('floor_plans').select('*');
    if (plansErr) throw plansErr;

    // Pull markers
    const { data: markersData, error: markersErr } = await client.from('marker_notes').select('*');
    if (markersErr) throw markersErr;

    // Pull annotations
    const { data: annotsData, error: annotsErr } = await client.from('whiteboard_annotations').select('*');
    if (annotsErr) throw annotsErr;

    // Map back to correct types
    const projects: Project[] = (projectsData || []).map(p => ({
      id: p.id,
      name: p.name,
      client: p.client,
      leader: p.leader,
      address: p.address,
      status: p.status,
      progress: p.progress,
      createdAt: Number(p.created_at)
    }));

    const plans: FloorPlan[] = (plansData || []).map(p => ({
      id: p.id,
      name: p.name,
      imageData: p.image_data,
      width: p.width,
      height: p.height,
      projectId: p.project_id || undefined,
      planType: (p.plan_type as any) || undefined,
      createdAt: Number(p.created_at)
    }));

    const markers: MarkerNote[] = (markersData || []).map(m => ({
      id: m.id,
      floorPlanId: m.floor_plan_id,
      x: m.x,
      y: m.y,
      title: m.title,
      photoData: m.photo_data,
      audioData: m.audio_data,
      transcription: m.transcription,
      textNotes: m.text_notes,
      comments: m.comments || [],
      tags: m.tags || [],
      createdAt: Number(m.created_at)
    }));

    const annots: WhiteboardAnnotation[] = (annotsData || []).map(a => ({
      id: a.id,
      floorPlanId: a.floor_plan_id,
      type: a.type as any,
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      color: a.color,
      content: a.content,
      userName: a.user_name,
      comments: a.comments || [],
      createdAt: Number(a.created_at)
    }));

    return {
      success: true,
      projects,
      plans,
      markers,
      annots,
      message: `Tìm thấy ${projects.length} dự án, ${plans.length} bản vẽ, ${markers.length} điểm ghim lỗi, và ${annots.length} nhãn dán trên đám mây.`
    };

  } catch (err: any) {
    console.error('Supabase pull error:', err);
    return {
      success: false,
      projects: [],
      plans: [],
      markers: [],
      annots: [],
      message: `Thao tác tải đám mây thất bại: ${err.message || err}`
    };
  }
}
