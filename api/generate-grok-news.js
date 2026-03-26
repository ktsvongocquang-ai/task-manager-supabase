import { createClient } from '@supabase/supabase-js';

// Vercel serverless cấu hình thời gian chạy tối đa
export const config = {
    maxDuration: 60  // Cho phép tối đa 60 giây (Grok có thể mất 20-40s để viết bài dài)
};

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("[Grok Cron] Bắt đầu tổng hợp tin tức...");
        const xaiApiKey = process.env.XAI_API_KEY;
        if (!xaiApiKey) {
            return res.status(500).json({ error: 'Missing XAI_API_KEY in server environment.' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
             return res.status(500).json({ error: 'Missing Supabase credentials.' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // === CHỐNG TRÙNG LẶP ===
        // Xác định phiên bản tin: Sáng (AM) hay Chiều (PM) theo giờ Việt Nam
        const now = new Date();
        const vnHour = (now.getUTCHours() + 7) % 24;
        const edition = vnHour < 12 ? 'AM' : 'PM';
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // Kiểm tra đã có bản tin cho phiên này chưa
        const { data: existing } = await supabaseAdmin
            .from('grok_news_feed')
            .select('id')
            .gte('created_at', `${todayStr}T00:00:00Z`)
            .eq('edition', edition)
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`[Grok Cron] Bản tin ${edition} ngày ${todayStr} đã tồn tại. Bỏ qua.`);
            return res.status(200).json({ success: true, message: `Bản tin ${edition} hôm nay đã có sẵn, không cần tạo mới.`, skipped: true });
        }

        // === GỌI API xAI ===
        const systemPrompt = `
Bạn là Giám đốc Phân tích Đầu tư (CIO) cấp cao và Biên tập viên tin tức kinh tế quốc tế.
Bạn CÓ QUYỀN TRUY CẬP VÀO DỮ LIỆU THỜI GIAN THỰC trên X (Twitter).
NHIỆM VỤ: Hãy quét các tin nóng hổi nhất trong 12-24 giờ qua và viết một "Bản tin Ban Giám Đốc" bao gồm 4 phần chính:

1. 🚨 CHIẾN SỰ & ĐỊA CHÍNH TRỊ — Các điểm nóng xung đột, bầu cử, cấm vận mới, căng thẳng ngoại giao.
2. 💰 GIÁ VÀNG & HÀNG HÓA — Biến động giá vàng thế giới (USD/oz), dầu thô Brent, tỷ giá USD/VND. Ghi rõ số liệu cụ thể nếu có.
3. 📈 CHỨNG KHOÁN — Dow Jones, S&P 500, Nasdaq (Mỹ), Nikkei (Nhật), VN-Index (Việt Nam). Phân tích xu hướng ngắn hạn.
4. 🇻🇳 TÁC ĐỘNG ĐẾN VIỆT NAM — Tổng hợp: Các sự kiện trên ảnh hưởng gì đến nhà đầu tư và doanh nghiệp Việt Nam?

YÊU CẦU ĐỊNH DẠNG:
- Markdown với Heading H2, H3 rõ ràng. KHÔNG dùng code block \`\`\`.
- Gắn emoji chuyên nghiệp (📈, 🚨, 💰, 🇻🇳) làm tiêu đề section.
- Nêu SỐ LIỆU CỤ THỂ khi có thể (giá vàng, chỉ số chứng khoán, tỷ giá).
- Kết thúc bằng dòng in nghiêng: "*Tin tức được tổng hợp tự động bởi Grok AI lúc [Giờ hiện tại theo múi giờ UTC+7]*".
        `;

        const requestBody = {
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Hãy lập báo cáo tin tức vĩ mô mới nhất ngay bây giờ. Hôm nay là ngày ${new Date().toLocaleDateString('vi-VN')}, phiên bản tin ${edition === 'AM' ? 'SÁNG' : 'CHIỀU'}.` }
            ],
            model: "grok-3-mini",
            stream: false,
            temperature: 0.3
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000); // Timeout 55s

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${xaiApiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`xAI API Error: ${response.status} - ${errData}`);
        }

        const xaiData = await response.json();
        const newsContent = xaiData.choices[0].message.content;
        const tokensUsed = xaiData.usage?.total_tokens || 0;

        // === LƯU VÀO SUPABASE ===
        const timeLabel = edition === 'AM' ? "Sáng" : "Chiều";
        const dateStrVN = new Date(now.getTime() + 7 * 60 * 60 * 1000).toLocaleDateString('vi-VN');
        const title = `Bản tin Vĩ mô ${timeLabel} ${dateStrVN}`;

        const { error } = await supabaseAdmin.from('grok_news_feed').insert({
            title: title,
            content_markdown: newsContent,
            category: 'Tổng hợp',
            ai_model: 'grok-3-mini',
            edition: edition
        });

        if (error) {
            throw error;
        }

        console.log(`[Grok Cron] Thành công! Tokens: ${tokensUsed}`);
        return res.status(200).json({ 
            success: true, 
            message: 'Đã tổng hợp tin tức thành công', 
            title,
            tokens_used: tokensUsed
        });

    } catch (err) {
        console.error("[Grok Cron] Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi xử lý tạo tin tức.' });
    }
}
