import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
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

        const prompt = `Bạn là Giám đốc Thiết kế Kiến trúc & Nội thất (Design Director) cấp cao. Hôm nay là ${dateStrFull}, phiên ${edition === 'AM' ? 'SÁNG' : 'CHIỀU'}.

Hãy dùng Google Search để tìm các thông tin thực tế mới nhất và tạo BẢNG TIN THIẾT KẾ & CÔNG NGHỆ cho đội ngũ nhân sự thiết kế.

QUY TẮC BẮT BUỘC:
- Chỉ dùng số liệu, xu hướng và phần mềm của năm 2026. Nếu không tìm thấy, ghi rõ "Chưa có thông tin hôm nay".
- Ghi rõ nguồn cho mỗi thông tin (Ví dụ: ArchDaily, Dezeen, Autodesk, ChatGPT).
- Không tự bịa thông tin.

CẤU TRÚC BẮT BUỘC (Markdown):

## 🎨 TÓM TẮT XU HƯỚNG HÔM NAY
[1-2 câu tóm tắt xu hướng nổi bật nhất trong ngày hôm nay về kiến trúc, nội thất hoặc công nghệ]

## 🏗️ XU HƯỚNG KIẾN TRÚC & NỘI THẤT 2026

| Hạng mục | Xu hướng hiện tại | Ứng dụng thực tế | Đánh giá / Ghi chú |
|---|---|---|---|
| Vật liệu mới | [cập nhật vật liệu xanh/thông minh] | [cách ứng dụng] | [ưu/nhược điểm] |
| Phong cách Nội thất | [cập nhật phong cách hot 2026] | [màu sắc, hình khối] | [phù hợp loại dự án nào] |
| Giải pháp Không gian | [thiết kế bền vững/đa năng] | [ví dụ] | [chi phí thi công] |

## 💻 CÔNG NGHỆ & PHẦN MỀM THIẾT KẾ
- **AI trong Thiết kế:** [Cập nhật mới nhất từ Midjourney, Stable Diffusion, hoặc AI tools năm 2026]
- **BIM & Phần mềm:** [Cập nhật mới nhất từ Revit, SketchUp, 3ds Max, Enscape, Corona, Lumion]
- **Thiết bị & VR/AR:** [Công nghệ trình diễn dự án cho khách hàng]

## 🎯 GÓC KỸ NĂNG & TRUYỀN CẢM HỨNG
- **Kỹ năng thiết yếu 2026:** [Kỹ năng mềm hoặc kỹ thuật cần có]
- **Dự án nổi bật thế giới:** [Tên 1 dự án kiến trúc mới hoàn thành hoặc đạt giải gần đây]
- **Lời khuyên cho Designer:** [Lời khuyên thực chiến khi gặp khách hàng hoặc tối ưu hiệu suất làm việc]

## 🚨 LƯU Ý KỸ THUẬT & THI CÔNG
[Các vấn đề thường gặp về kỹ thuật thi công, lỗi sai kích thước, hoặc xu hướng chi tiết cấu tạo]

**Lưu ý:** Hãy luôn sáng tạo, cập nhật công nghệ và bám sát thực tế thi công để tạo ra những bản vẽ chất lượng nhất.
*Bản tin thiết kế tổng hợp tự động bởi Gemini AI lúc ${dateVN.toLocaleTimeString('vi-VN')} UTC+7*`;

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
        const title = `Bảng Tin Thiết Kế ${timeLabel} ${dateStrVN}`;

        const { error } = await supabaseAdmin.from('grok_news_feed').insert({
            title,
            content_markdown: newsContent,
            category: 'Thiết kế & Công nghệ',
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
