import { createClient } from '@supabase/supabase-js';

// Vercel serverless function (Runs in Node.js environment, not in the browser)
export default async function handler(req, res) {
    // Zalo webhook verification
    if (req.method === 'GET') {
        return res.status(200).send('OK');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Handle Zalo Webhook messages
    if (req.body && req.body.event_name === 'user_send_text') {
        try {
            const userId = req.body.sender?.id;
            const msg = req.body.message?.text || '';
            
            if (userId && msg) {
                const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
                const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
                
                if (supabaseUrl && serviceKey) {
                    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
                    
                    // Helper to reply via Zalo OA
                    const sendZaloReply = async (text) => {
                        try {
                            const { data } = await supabaseAdmin.from('system_settings').select('value').eq('id', 'notification_settings').single();
                            const zaloToken = data?.value?.zalo?.token;
                            if (!zaloToken) return;
                            
                            await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'access_token': zaloToken },
                                body: JSON.stringify({ recipient: { user_id: userId }, message: { text: text } })
                            });
                        } catch (e) { console.error('Zalo Send Error', e); }
                    };

                    // 1. Auto-linking logic if message is an email
                    if (msg.includes('@') && !msg.includes(' ')) {
                        const email = msg.trim().toLowerCase();
                        const { data } = await supabaseAdmin.from('profiles').update({ zalo_user_id: userId }).eq('email', email).select();
                        if (data && data.length > 0) {
                            await sendZaloReply(`Tuyệt vời! Tài khoản của bạn (${data[0].full_name}) đã được liên kết Zalo thành công. Bạn có thể nhắn tin cho tôi để cập nhật tiến độ công việc nhé!`);
                        } else {
                            await sendZaloReply(`Không tìm thấy email ${email} trong hệ thống. Vui lòng kiểm tra lại.`);
                        }
                    } 
                    // 2. Interactive AI Bot Logic
                    else {
                        const { data: profile } = await supabaseAdmin.from('profiles').select('id, full_name, role').eq('zalo_user_id', userId).single();
                        if (!profile) {
                            await sendZaloReply('Tài khoản Zalo của bạn chưa được liên kết với hệ thống DQH. Vui lòng gửi địa chỉ email đăng nhập của bạn vào đây để liên kết nhé!');
                        } else {
                            // Fetch user's pending tasks
                            const { data: tasks } = await supabaseAdmin
                                .from('kanban_tasks')
                                .select('id, title, status, projects(name)')
                                .eq('assignee_id', profile.id)
                                .neq('status', 'DONE');
                            
                            const taskContext = tasks && tasks.length > 0 
                                ? tasks.map(t => `- [ID: ${t.id}] ${t.title} (DA: ${t.projects?.name || 'Chung'}) - Status: ${t.status}`).join('\n')
                                : 'Không có công việc nào đang mở.';

                            const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                            if (geminiApiKey) {
                                const { GoogleGenAI } = await import('@google/genai');
                                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                                
                                const systemPrompt = `Bạn là Trợ lý AI Bot trên Zalo của công ty thiết kế kiến trúc DQH Architects.
Người đang chat với bạn là ${profile.full_name} (${profile.role}).
Danh sách công việc (tasks) ĐANG MỞ của người này trên hệ thống:
${taskContext}

Dựa vào câu nói của nhân sự: "${msg}"
Hãy suy luận ý định của họ.
Các trạng thái hợp lệ (status): TODO, IN_PROGRESS, REVIEW, DONE.
Nếu họ muốn hoàn thành task, trả về newStatus = 'DONE'.
TRẢ VỀ DUY NHẤT 1 ĐOẠN JSON CHUẨN:
{
  "action": "UPDATE_TASK" | "REPLY",
  "taskId": "id của task nếu có (nếu không xác định được thì để null)",
  "newStatus": "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | null,
  "replyMessage": "Câu trả lời của bạn gửi cho nhân sự (Ngắn gọn, thân thiện, xưng hô phù hợp)"
}`;
                                const response = await ai.models.generateContent({
                                    model: 'gemini-2.5-flash',
                                    contents: systemPrompt,
                                    config: { temperature: 0.1, responseMimeType: 'application/json' }
                                });
                                
                                const aiResult = JSON.parse(response.text);
                                
                                if (aiResult.action === 'UPDATE_TASK' && aiResult.taskId && aiResult.newStatus) {
                                    await supabaseAdmin.from('kanban_tasks').update({ status: aiResult.newStatus }).eq('id', aiResult.taskId);
                                }
                                if (aiResult.replyMessage) {
                                    await sendZaloReply(aiResult.replyMessage);
                                }
                            } else {
                                await sendZaloReply('Hệ thống Bot AI chưa được cấu hình API Key.');
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Zalo Webhook Error:', e);
        }
        return res.status(200).json({ error: 0, message: "Success" });
    }

    const { action, payload } = req.body;

    // Support both VITE_ prefixed (Vercel) and plain env vars
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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
                headers: { 'Content-Type': 'application/json' },
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
