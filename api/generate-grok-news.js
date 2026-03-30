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

        const prompt = `Bạn là Giám đốc Phân tích Đầu tư (CIO) cấp cao. Hôm nay là ${dateStrFull}, phiên ${edition === 'AM' ? 'SÁNG' : 'CHIỀU'}.

Hãy dùng Google Search để tìm các thông tin thực tế mới nhất và tạo BẢNG TIN ĐẦU TƯ cho CEO.

QUY TẮC BẮT BUỘC:
- Chỉ dùng số liệu của năm 2026. Nếu không tìm thấy, ghi rõ "Chưa có dữ liệu hôm nay".
- Ghi rõ nguồn và giờ cập nhật cho mỗi số liệu.
- Không tự bịa số liệu.

CẤU TRÚC BẮT BUỘC (Markdown):

## 📊 EXECUTIVE SUMMARY (CHO CEO)
[1-2 câu tóm tắt tình hình thị trường hôm nay, rủi ro chính, cơ hội lớn nhất]

## 📈 BẢNG THÔNG TIN ĐẦU TƯ

| Chỉ số | Giá trị hiện tại | Thay đổi | Hành động CEO hôm nay | Ghi chú / Rủi ro |
|---|---|---|---|---|
| VN-Index | [cập nhật từ HOSE] | +/- % | DCA / Hold / Bán | - |
| Vàng Thế Giới | [USD/ounce - Kitco/Bloomberg] | +/- % | Giữ / Mua dip | - |
| Vàng SJC | Mua: … / Bán: … (triệu/lượng) | +/- triệu | Giữ / Mua thêm | - |
| BĐS TP.HCM | Trung tâm: … triệu/m² | +/- % | Theo dõi | Thanh khoản |
| BĐS Bình Dương | Đất KCN: … triệu/m² | +/- % | Mua dần | FDI tăng |
| BĐS Đắk Lắk | Đất đô thị: … triệu/m² | +/- % | Dài hạn | Hạ tầng |
| Xăng RON 95 | [Petrolimex] | +/- | Kiểm soát logistics | - |

## 🎯 HÀNH ĐỘNG ƯU TIÊN CHO CEO HÔM NAY
- [Bullet 1: mua gì, bán gì]
- [Bullet 2: rủi ro cần theo dõi]
- [Bullet 3: cơ hội ngắn hạn]

## 🚨 PHÂN TÍCH ĐỊA CHÍNH TRỊ & CHIẾN SỰ
[Trung Đông, Mỹ-Trung, thuế quan Trump, tác động thị trường]

## 🇻🇳 TÁC ĐỘNG ĐẾN VIỆT NAM
[XNK, FDI, logistics, lạm phát, lãi suất, khuyến nghị doanh nghiệp]

## 🏗️ NGÀNH XÂY DỰNG & NỘI THẤT

### Bảng giá Vật tư Xây dựng tại TP.HCM
| Vật tư | Đơn vị | Giá (VND) | Xu hướng | Khuyến nghị |
|---|---|---|---|---|
| Xi măng | tấn | [giá] | ↑/↓ | - |
| Sắt / Thép | kg | [giá] | ↑/↓ | - |
| Gạch xây | viên | [giá] | ↑/↓ | - |
| Nhôm thanh | kg | [giá] | ↑/↓ | - |
| Kính 8mm | m² | [giá] | ↑/↓ | - |
| Gỗ công nghiệp | m² | [giá] | ↑/↓ | - |

### Lời khuyên CEO ngành xây dựng & nội thất
- [Chiến lược mua vật tư, thời điểm đặt hàng, cơ hội dự án HCM và Đắk Lắk]

## 🔮 DỰ BÁO VĨ MÔ
- **Tuần sau:** [ngắn gọn]
- **Tháng 4:** [ngắn gọn]
- **Quý II/2026:** GDP VN ước tính
- **Cả năm 2026:** VN-Index mục tiêu

**Lưu ý:** Đây không phải lời khuyên tài chính cá nhân. Luôn tham khảo cố vấn chuyên môn.
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
        const title = `Bảng Tin Đầu Tư ${timeLabel} ${dateStrVN}`;

        const { error } = await supabaseAdmin.from('grok_news_feed').insert({
            title,
            content_markdown: newsContent,
            category: 'Đầu tư CEO',
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
