import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL and Key are missing. Please check your .env file.')
}

// Fallback URLs to prevent fatal crashes during build or when env vars are missing
const safeUrl = supabaseUrl || 'https://placeholder-project.supabase.co'
const safeKey = supabaseAnonKey || 'placeholder-key'
const safeServiceKey = supabaseServiceKey || 'placeholder-service-key'

export const supabase = createClient(safeUrl, safeKey)

// Use this client for administrative tasks like creating new users or updating passwords
// Requires VITE_SUPABASE_SERVICE_ROLE_KEY in .env for full admin access
export const supabaseAdmin = createClient(safeUrl, safeServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export const uploadImageToStorage = async (file: File): Promise<string> => {
  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('project-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('project-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
