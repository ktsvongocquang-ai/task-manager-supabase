import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("Bat dau chay Cron job lay tin Grok...");
        const xaiApiKey = process.env.XAI_API_KEY;
        if (!xaiApiKey) {
            return res.status(500).json({ error: 'Missing XAI_API_KEY in server environment.' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
             return res.status(500).json({ error: 'Missing Supabase credentials.' });
        }

        // Gọi API của xAI
        const systemPrompt = `
Bạn là Giám đốc Phân tích Đầu tư (CIO) cấp cao và Biên tập viên tin tức kinh tế quốc tế.
Bạn CÓ QUYỀN TRUY CẬP VÀO DỮ LIỆU THỜI GIAN THỰC trên X (Twitter).
NHIỆM VỤ: Hãy quét các tin nóng hổi nhất trong 12-24 giờ qua và viết một "Bản tin Ban Giám Đốc" bao gồm 3 phần chính:
1. Tình hình chiến sự / Địa chính trị toàn cầu (các điểm nóng, bầu cử, cấm vận quan trọng).
2. Biến động thị trường Hàng hóa (Giá Vàng) và Tiền tệ (Tỷ giá USD, Crypto).
3. Tin tức Chứng khoán (Dow Jones Mỹ, các chỉ số châu Á).

YÊU CẦU ĐỊNH DẠNG:
- Trình bày dạng Markdown với thẻ Heading H2, H3 rõ ràng. KHÔNG dùng markdown block \`\`\`
- Gắn một vài icon/emoji chuyên nghiệp (📈, 🚨, 💰) để tin tức sống động.
- Nêu rõ: "Sự kiện này tác động gì đến giới đầu tư Việt Nam?".
- Cuối bản tin, chèn dòng chữ in nghiêng: "*Tin tức được tổng hợp tự động bởi Grok AI theo thời gian thực lúc [Giờ hiện tại]*".
        `;

        const requestBody = {
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: "Hãy lập báo cáo tin tức vĩ mô mới nhất ngay bây giờ."
                }
            ],
            model: "grok-beta",
            stream: false,
            temperature: 0.2
        };

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${xaiApiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`xAI API Error: ${response.status} - ${errData}`);
        }

        const xaiData = await response.json();
        const newsContent = xaiData.choices[0].message.content;

        // Lưu vào Supabase
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Tạo title tự động
        const now = new Date();
        now.setHours(now.getHours() + 7); // Giờ VN
        const isMorning = now.getHours() < 12;
        const timeLabel = isMorning ? "Sáng" : "Chiều";
        const dateStr = now.toLocaleDateString('vi-VN');
        const title = `Bản tin Vĩ mô ${timeLabel} ${dateStr}`;

        const { error } = await supabaseAdmin.from('grok_news_feed').insert({
            title: title,
            content_markdown: newsContent,
            category: 'Tổng hợp',
            ai_model: 'grok-beta'
        });

        if (error) {
            throw error;
        }

        return res.status(200).json({ success: true, message: 'Đã tổng hợp tin tức thành công', title });

    } catch (err) {
        console.error("Grok News Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi xử lý tạo tin tức.' });
    }
}
