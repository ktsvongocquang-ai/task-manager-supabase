import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { adAccountId } = req.query;
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return res.status(500).json({ error: 'Thiếu cấu hình Supabase Admin trong biến môi trường.' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        let query = supabaseAdmin.from('marketing_ai_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (adAccountId) {
            query = query.eq('ad_account_id', adAccountId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return res.status(200).json({ reports: data });
    } catch (err) {
        console.error("Lỗi khi lấy lịch sử báo cáo:", err);
        return res.status(500).json({ error: err.message || 'Lỗi server.' });
    }
}
