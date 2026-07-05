import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (req.query?.job === 'zalo') {
        try {
            const response = await fetch('https://zalo-bot-server.onrender.com/api/remind-all', { method: 'POST' });
            return res.status(200).json(await response.json());
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    if (req.query?.job === 'zalo_webhook') {
        try {
            const { sender_id, text } = req.body;
            if (!sender_id || !text) return res.status(400).json({ error: 'Missing data' });

            const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
            const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseAdmin = createClient(supabaseUrl, serviceKey);

            // 1. Find user by zalo_user_id
            const { data: user } = await supabaseAdmin.from('profiles').select('*').eq('zalo_user_id', sender_id).single();
            if (!user) {
                return res.status(200).json({ reply_message: 'Số điện thoại Zalo của bạn chưa được liên kết với hệ thống quản lý công việc.' });
            }

            // 2. Fetch user's active tasks
            const { data: tasks } = await supabaseAdmin.from('tasks')
                .select('*')
                .eq('assignee_id', user.staff_id)
                .neq('status', 'Hoàn thành')
                .neq('status', 'Hủy bỏ');

            // 3. AI Analysis with Gemini
            const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            
            const systemPrompt = `Bạn là Trợ lý AI Quản lý Công việc. 
            Nhân viên tên ${user.full_name} (${user.role}) vừa nhắn tin: "${text}".
            Danh sách Task đang làm:
            ${tasks?.map(t => `- [ID: ${t.id}] ${t.title} (Trạng thái: ${t.status})`).join('\n') || 'Không có task nào'}
            
            Nhiệm vụ của bạn là:
            1. Tìm xem nhân viên đang nói đến task nào.
            2. Nếu họ báo cáo đã hoàn thành, hãy gọi hàm update_task_status(id, 'Hoàn thành', 'Báo cáo qua Zalo: ...').
            3. Nếu họ báo cáo tiến độ, gọi hàm add_comment(id, comment).
            4. Trả về một câu trả lời ngắn gọn, thân thiện (dưới 20 từ) để bot gửi lại cho nhân viên.`;

            // Since we can't easily use tools with raw fetch, we will just ask Gemini to output JSON
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt + '\n\nYêu cầu: Hãy trả về ĐÚNG định dạng JSON sau (không chứa ký tự markdown):\n{"action": "update_status", "task_id": "...", "status": "Hoàn thành", "reply": "Đã cập nhật hoàn thành!"} HOẶC {"action": "comment", "task_id": "...", "comment": "...", "reply": "Đã ghi nhận tiến độ!"} HOẶC {"action": "none", "reply": "Câu trả lời tự nhiên của bạn..."}',
                config: { responseMimeType: "application/json" }
            });

            let aiResult = { action: 'none', reply: 'Đã nhận thông tin!' };
            try {
                aiResult = JSON.parse(response.text);
            } catch (e) { console.error('JSON parse error', e); }

            // 4. Execute Action
            if (aiResult.action === 'update_status' && aiResult.task_id) {
                await supabaseAdmin.from('tasks').update({ status: aiResult.status }).eq('id', aiResult.task_id);
            } else if (aiResult.action === 'comment' && aiResult.task_id) {
                await supabaseAdmin.from('task_comments').insert({
                    task_id: aiResult.task_id,
                    user_id: user.id,
                    content: aiResult.comment
                });
            }

            return res.status(200).json({ reply_message: aiResult.reply || 'Đã ghi nhận!' });
        } catch (e) {
            console.error('Webhook error:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    try {
        const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
            return res.status(500).json({ error: 'Missing Supabase credentials.' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Xác định phiên: Sáng (AM) hay Chiều (PM) theo giờ Việt Nam
        const now = new Date();
        const vnHour = (now.getUTCHours() + 7) % 24;
        const edition = vnHour < 12 ? 'AM' : 'PM';
        const todayStr = now.toISOString().split('T')[0];
        const forceRegenerate = req.query?.force === 'true';

        // Kiểm tra đã có bản tin chưa
        const { data: existing } = await supabaseAdmin
            .from('grok_news_feed')
            .select('id')
            .gte('created_at', `${todayStr}T00:00:00Z`)
            .eq('edition', edition)
            .limit(1);

        if (existing && existing.length > 0) {
            if (forceRegenerate) {
                await supabaseAdmin.from('grok_news_feed').delete().eq('id', existing[0].id);
            } else {
                return res.status(200).json({ success: true, skipped: true, message: `Bản tin ${edition} hôm nay đã có.` });
            }
        }

        const dateVN = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const dateStrFull = dateVN.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const dateOnlyVN = dateVN.toISOString().split('T')[0];

        const prompt = `Bạn là Giám đốc Điều hành (CEO) kiêm Giám đốc Thiết kế cấp cao. Hôm nay là ${dateStrFull}, phiên ${edition === 'AM' ? 'SÁNG' : 'CHIỀU'}.

Hãy dùng Google Search để tìm các thông tin thực tế mới nhất và tạo "BẢNG TIN CÔNG TY" hàng ngày dành cho toàn bộ nhân sự (đặc biệt là đội ngũ thiết kế, quản lý và marketing).

QUY TẮC BẮT BUỘC:
- Chỉ dùng số liệu, xu hướng và luật của năm 2026. Nếu không tìm thấy, ghi rõ "Chưa có thông tin cập nhật hôm nay".
- Ghi rõ nguồn và giờ cập nhật cho mỗi số liệu.
- Không tự bịa thông tin.

CẤU TRÚC BẮT BUỘC (Markdown):

## 📊 EXECUTIVE SUMMARY (TÌNH HÌNH CHUNG)
[1-2 câu tóm tắt nhanh tình hình vĩ mô, chính trị hoặc điểm nóng kinh tế quan trọng nhất trong ngày]

## 🌍 CHÍNH TRỊ - KINH TẾ & ĐỜI SỐNG HÀNG NGÀY
| Chỉ số / Mặt hàng | Giá trị hiện tại / Cập nhật | Thay đổi | Ghi chú / Tác động |
|---|---|---|---|
| Chính trị & Xã hội | [Tin chính trị nổi bật VN/Thế giới] | - | [Tác động tới đời sống/kinh tế] |
| Giá Vàng SJC / 9999 | ↑/↓ [giá mua/bán] | +/- | - |
| Xăng RON 95 / Dầu | ↑/↓ [giá cập nhật] | +/- | [Tác động chi phí đi lại] |
| Thực phẩm & Ăn uống | [Giá thịt/rau hoặc lạm phát ăn uống] | ↑/↓ | [Tác động chi phí sinh hoạt của nhân sự] |
| Bất động sản | [Biến động giá TP.HCM, Đắk Lắk...] | ↑/↓ | - |

## ⚖️ PHÁP LÝ & QUY HOẠCH (DÀNH CHO QUẢN LÝ & THIẾT KẾ)
- **Luật/Nghị định mới:** [Các luật liên quan Đất đai, Xây dựng, PCCC, Thuế... mới có hiệu lực hoặc dự thảo nóng]
- **Quy hoạch & Hạ tầng:** [Các dự án cao tốc, sân bay, quy hoạch đô thị mới ảnh hưởng tới BĐS]

## 🏗️ THỊ TRƯỜNG VẬT TƯ & THI CÔNG
| Vật liệu trọng điểm | Xu hướng giá | Lời khuyên cho Sale/Thi công |
|---|---|---|
| Sắt, Thép | ↑/↓ [giá/kg] | [Chiến lược báo giá/đặt hàng] |
| Xi măng, Cát, Gạch | ↑/↓ | - |
| Kính, Nhôm, Gỗ CN | ↑/↓ | - |

## 🎨 XU HƯỚNG THIẾT KẾ & CÔNG NGHỆ (DÀNH CHO DESIGNER)
- **Vật liệu & Phong cách 2026:** [Cập nhật xu hướng vật liệu xanh, smart home, phong cách nội thất đang hot]
- **Công nghệ & Phần mềm:** [Cập nhật từ AI Midjourney, Stable Diffusion, Revit, Enscape, Corona...]
- **Lưu ý Kỹ thuật Thi công:** [Cảnh báo lỗi kích thước, quy chuẩn cấu tạo thường gặp dạo gần đây]

## 🎯 GÓC TRUYỀN CẢM HỨNG & KỸ NĂNG
- **Dự án nổi bật:** [Review nhanh 1 dự án kiến trúc ấn tượng mới hoàn thành trên thế giới/VN]
- **Kỹ năng sống còn:** [Lời khuyên thực chiến khi làm việc với khách hàng, đối phó deadline hoặc tối ưu hiệu suất]

**Lưu ý:** Hãy giữ văn phong chuyên nghiệp, truyền cảm hứng và mang tính thực tiễn cao, gần gũi với đời sống anh em nhân viên.
*Bản tin tổng hợp tự động bởi Gemini AI lúc ${dateVN.toLocaleTimeString('vi-VN')} UTC+7*`;

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const newsContentRaw = response.text;
        if (!newsContentRaw) {
            throw new Error('Gemini không trả về nội dung.');
        }

        // Xóa thẻ SUY_NGHĨ nếu có
        const newsContent = newsContentRaw.replace(/<SUY_NGHĨ>[\s\S]*?<\/SUY_NGHĨ>/gi, '').trim();

        const timeLabel = edition === 'AM' ? 'Sáng' : 'Chiều';
        const dateStrVN = dateVN.toLocaleDateString('vi-VN');
        const title = `Bảng Tin Công Ty ${timeLabel} ${dateStrVN}`;

        const { error } = await supabaseAdmin.from('grok_news_feed').insert({
            title,
            content_markdown: newsContent,
            category: 'Tin Tức Nội Bộ',
            ai_model: 'gemini-2.5-flash (google_search)',
            edition,
            edition_date: dateOnlyVN,
        });

        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Tạo bản tin thành công!', title });

    } catch (err) {
        console.error('[generate-grok-news] Error:', err);
        return res.status(500).json({ error: err.message || 'Lỗi tạo tin tức.' });
    }
}
