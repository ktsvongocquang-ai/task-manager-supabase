import { createClient } from '@supabase/supabase-js';
import { handleChatMessage } from '../lib/core/chat.js';
import { sendZaloText } from '../lib/core/notify.js';

// Vercel serverless function (Runs in Node.js environment, not in the browser)
export default async function handler(req, res) {
    // Zalo webhook verification
    if (req.method === 'GET') {
        return res.status(200).send('OK');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Webhook Zalo OA cũ trỏ vào /api/admin: chuyển sang bộ não chung (lib/core/chat.js)
    if (req.body && req.body.event_name === 'user_send_text') {
        try {
            const uid = req.body.sender?.id, text = req.body.message?.text || '';
            if (uid && text) {
                const reply = await handleChatMessage({ channel: 'zalo', senderId: uid, text });
                await sendZaloText(uid, reply, 'oa');
            }
        } catch (e) { console.error('Zalo Webhook Error:', e); }
        return res.status(200).json({ error: 0, message: "Success" });
    }

    const { action, payload } = req.body;

    // Support both VITE_ prefixed (Vercel) and plain env vars
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ error: 'Missing Supabase Admin credentials on the server.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        if (action === 'update_password') {
            const { userId, newPassword } = payload;
            if (!userId || !newPassword) {
                return res.status(400).json({ error: 'Missing userId or newPassword' });
            }

            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: newPassword
            });

            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else if (action === 'create_user') {
            const { email, password, full_name } = payload;
            if (!email || !password) {
                return res.status(400).json({ error: 'Missing email or password' });
            }

            // Use admin.createUser to bypass email confirmation
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name }
            });

            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else if (action === 'update_email') {
            const { userId, newEmail } = payload;
            if (!userId || !newEmail) {
                return res.status(400).json({ error: 'Missing userId or newEmail' });
            }

            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                email: newEmail,
                email_confirm: true // Auto-confirm without requiring verification
            });

            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else if (action === 'auto_provision_profile') {
            const { id, email, full_name, role, staff_id, position } = payload;
            
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id,
                    email,
                    full_name,
                    role,
                    staff_id,
                    position
                })
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, profile: data });
        }

        else if (action === 'send_zalo_message') {
            const { staffName, message } = payload;
            if (!staffName || !message) {
                return res.status(400).json({ error: 'Missing staffName or message' });
            }

            // Search for user
            const { data: profiles, error: profileErr } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, zalo_user_id')
                .ilike('full_name', `%${staffName}%`);
            
            if (profileErr) throw profileErr;
            if (!profiles || profiles.length === 0) {
                return res.status(404).json({ error: `Không tìm thấy nhân sự tên ${staffName} trong hệ thống.` });
            }
            
            const targetProfile = profiles.find(p => p.zalo_user_id) || profiles[0];
            if (!targetProfile.zalo_user_id) {
                return res.status(400).json({ error: `Nhân sự ${targetProfile.full_name} chưa liên kết tài khoản Zalo.` });
            }

            // Fetch Zalo Token
            // Đã chuyển sang dùng Bot Server, không cần kiểm tra Zalo Token nữa.
            // Gửi tin nhắn qua Zalo Bot Server (Render)
            const zaloRes = await fetch('https://zalo-bot-server.onrender.com/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(process.env.ZALO_BOT_SECRET ? { 'x-bot-secret': process.env.ZALO_BOT_SECRET } : {}) },
                body: JSON.stringify({ 
                    phone: targetProfile.zalo_user_id, 
                    message: message 
                })
            });

            const zaloData = await zaloRes.json().catch(() => ({}));
            
            if (!zaloRes.ok || !zaloData.success) {
                console.error('Zalo Bot Send Error:', zaloData);
                const errorMsg = zaloData.error || 'Lỗi không xác định từ Bot Server';
                return res.status(400).json({ error: `Lỗi Zalo Bot: ${errorMsg}` });
            }

            return res.status(200).json({ success: true, message: `Đã gửi Zalo cho ${targetProfile.full_name} thành công!` });
        }

        else if (action === 'save_settings') {
            const { id, value } = payload;
            if (!id || !value) return res.status(400).json({ error: 'Missing id or value' });

            const { data, error } = await supabaseAdmin
                .from('system_settings')
                .upsert({ id, value }, { onConflict: 'id' })
                .select()
                .single();
            
            if (error) throw error;
            return res.status(200).json({ success: true, data });
        }
        else {
            return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}
