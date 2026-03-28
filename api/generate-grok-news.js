import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel serverless cấu hình thời gian chạy tối đa
export const config = {
    maxDuration: 60  // Cho phép tối đa 60 giây (Grok có thể mất 20-40s để viết bài dài)
};

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("[Gemini Cron] Bắt đầu tổng hợp tin tức...");
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
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
        const forceRegenerate = req.query?.force === 'true';

        // Kiểm tra đã có bản tin cho phiên này chưa
        const { data: existing } = await supabaseAdmin
            .from('grok_news_feed')
            .select('id')
            .gte('created_at', `${todayStr}T00:00:00Z`)
            .eq('edition', edition)
            .limit(1);

        if (existing && existing.length > 0) {
            if (forceRegenerate) {
                // Xóa bản tin cũ để tạo mới
                await supabaseAdmin.from('grok_news_feed').delete().eq('id', existing[0].id);
                console.log(`[Grok] Force regenerate: đã xóa bản tin ${edition} cũ.`);
            } else {
                console.log(`[Grok Cron] Bản tin ${edition} ngày ${todayStr} đã tồn tại. Bỏ qua.`);
                return res.status(200).json({ success: true, message: `Bản tin ${edition} hôm nay đã có sẵn, không cần tạo mới.`, skipped: true });
            }
        }

        // === GỌI API xAI ===
        const dateVN = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const dateStrFull = dateVN.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const dateOnlyVN = dateVN.toISOString().split('T')[0]; // YYYY-MM-DD

        const systemPrompt = `Bạn là Giám đốc Phân tích Đầu tư (CIO) cấp cao.
Bạn CÓ QUYỀN TRUY CẬP VÀO DỮ LIỆU THỜI GIAN THỰC qua Google Search.

🔴 QUY TẮC BẮT BUỘC (TRUY TÌM SỰ THẬT - CHỈ DÙNG NĂM 2026):
1. TUYỆT ĐỐI KHÔNG HÀNH ĐỘNG THEO TRÍ NHỚ (TRAINING DATA). Mọi con số phải đến từ kết quả Search của năm 2026.
2. ĐỐI SOÁT NĂM: Khi Search, AI phải kiểm tra kỹ ngày tháng năm của bài báo. Nếu bài báo không ghi năm 2026, TUYỆT ĐỐI KHÔNG lấy số liệu đó (tránh lấy nhầm giá 90-95 triệu của năm 2024/2025).
3. QUY TẮC CUỐI TUẦN: Vì hôm nay là Thứ Bảy (${dateStrFull}), nếu không tìm thấy giá niêm yết mới của hôm nay, BẮT BUỘC lấy giá chốt phiên Thứ Sáu ngày 27/03/2026. TUYỆT ĐỐI KHÔNG được tự ý điền con số lạ.
4. GHI RÕ NGUỒN (HOSE, SJC, Bloomberg, Petrolimex...) và GIỜ cập nhật.
5. GHI RÕ NGUỒN (HOSE, SJC, Bloomberg, Petrolimex...) và GIỜ cập nhật.
6. Đối với BĐS, nếu không có tin tức biến động hôm nay, hãy ghi nhận xét về xu hướng thị trường dựa trên các báo cáo quý gần nhất.

Hãy tạo ngay **BẢNG THÔNG TIN ĐẦU TƯ CHUẨN HÀNG NGÀY** theo định dạng tối ưu cho CEO.

**Dữ liệu cần cập nhật mới nhất từ thị trường:**
- VN-Index đóng cửa phiên gần nhất + % thay đổi (nguồn: HOSE)
- Giá vàng thế giới spot USD/ounce (nguồn: Kitco/Bloomberg)
- Giá vàng SJC mua/bán chính xác đến 10.000đ (nguồn: SJC/DOJI)
- Giá vật tư xây dựng thực tế tại TP.HCM (nguồn: nhà sản xuất/đại lý)
- Giá xăng dầu niêm yết hiện hành (nguồn: Petrolimex)
- Xu hướng BĐS: TP.HCM, Bình Dương, Đắk Lắk

**Nội dung cố định phải tích hợp:**
- Địa chính trị: Trung Đông, Mỹ-Trung, thuế quan Trump.
- Chứng khoán Mỹ: Nasdaq, S&P500, Dow Jones (giá đóng cửa phiên gần nhất).
- Tác động VN: Logistics, xuất khẩu, FDI, lạm phát, lãi suất.

YÊU CẦU ĐỊNH DẠNG (QUAN TRỌNG - TUÂN THỦ CHÍNH XÁC):
- Viết bằng Markdown. KHÔNG dùng code block.
- Dùng bảng Markdown chuẩn (dấu |) cho bảng dữ liệu.
- Gắn emoji chuyên nghiệp cho tiêu đề section.
- MỌI SỐ LIỆU phải kèm nguồn trong ngoặc (ví dụ: "1.280 điểm *(HOSE 15:00)*").

CẤU TRÚC BẮT BUỘC (không thêm, không bớt):

## 📊 EXECUTIVE SUMMARY (CHO CEO)
[Viết 1–2 câu tóm tắt cao cấp: tình hình thị trường hôm nay, rủi ro chính, cơ hội lớn nhất]

## 📈 BẢNG THÔNG TIN ĐẦU TƯ

| Chỉ số | Giá trị hiện tại | Thay đổi | Hành động CEO hôm nay | Ghi chú / Rủi ro |
|---|---|---|---|---|
| VN-Index | [cập nhật] | +/- % | DCA / Hold / Bán | - |
| Vàng Thế Giới | [USD/ounce] | +/- % | Giữ / Mua dip / Chốt | - |
| Vàng SJC Trong Nước | Mua: … / Bán: … (triệu VND/lượng) | +/- triệu | Giữ / Mua thêm | Chênh lệch SJC |
| BĐS TP.HCM | Đất trung tâm: … triệu/m² / Căn hộ: … triệu/m² | +/- % | Theo dõi / Mua hạ tầng | Thanh khoản |
| BĐS Bình Dương | Đất KCN: … triệu/m² / Nhà phố: … triệu/m² | +/- % | Mua dần FDI | Tăng mạnh |
| BĐS Đắk Lắk | Đất đô thị: … triệu/m² / Đất du lịch: … triệu/ha | +/- % | Mua dài hạn hạ tầng | Tăng mạnh Km7 |
| Tỷ trọng danh mục gợi ý | Vàng: 25–30% / Cổ phiếu VN: 55–60% / Tiền mặt: 10–15% | - | Rebalance nếu lệch >5% | - |
| Ngành ưu tiên | Ngân hàng (VCB, MBB, BID), Tiêu dùng (MWG, PNJ, VNM), Logistics (GEX) | - | DCA tuần này | Ít phụ thuộc Mỹ |

## 🎯 HÀNH ĐỘNG ƯU TIÊN CHO CEO HÔM NAY
[Viết ngắn gọn 2–3 bullet: mua gì, bán gì, tỷ trọng điều chỉnh, rủi ro cần theo dõi]

## 🔮 TÓM TẮT DỰ ĐOÁN VĨ MÔ
- **Tuần sau:** Biến động cao, ưu tiên vàng & phòng thủ.
- **Tháng 4:** Phục hồi nhẹ nếu địa chính trị lắng.
- **Quý II:** GDP VN 6,5–7,0%.
- **Cả năm 2026:** VN-Index mục tiêu 1.450–1.550 điểm (kịch bản cơ sở).

## 🚨 PHÂN TÍCH ĐỊA CHÍNH TRỊ & CHIẾN SỰ
[Chi tiết các điểm nóng: Trung Đông, Mỹ-Trung, thuế quan, và tác động đến thị trường]

## 🇻🇳 TÁC ĐỘNG ĐẾN VIỆT NAM
[Phân tích cụ thể: XNK, FDI, logistics, lạm phát, lãi suất, và khuyến nghị doanh nghiệp]

## 🏗️ NGÀNH XÂY DỰNG & NỘI THẤT
Phân tích giá vật tư xây dựng cho CEO công ty kiến trúc & nội thất:

### Bảng giá Vật tư Xây dựng
| Vật tư | Đơn vị | Giá hiện tại (VND) | Xu hướng | Khuyến nghị |
|---|---|---|---|---|
| Xi măng | tấn | [giá] | ↑/↓ % | Mua dự trữ / Chờ giảm |
| Sắt / Thép | kg | [giá] | ↑/↓ % | - |
| Gạch xây dựng | viên | [giá] | ↑/↓ % | - |
| Đá xây dựng | m³ | [giá] | ↑/↓ % | - |
| Nhôm (thanh định hình) | kg | [giá] | ↑/↓ % | - |
| Kính (tấm 8mm) | m² | [giá] | ↑/↓ % | - |
| Gỗ công nghiệp | m² | [giá] | ↑/↓ % | - |
| Xăng RON 95 | lít | [giá] | ↑/↓ | Ảnh hưởng vận chuyển |
| Dầu diesel | lít | [giá] | ↑/↓ | Ảnh hưởng thi công |

### Lời khuyên cho CEO ngành xây dựng nội thất
- [2-3 bullet: Chiến lược mua vật tư, thời điểm đặt hàng, cơ hội dự án tại HCM và Đắk Lắk]

Kết thúc bằng:
- Dòng: "**Lưu ý:** Đây không phải lời khuyên tài chính cá nhân. Luôn tham khảo cố vấn chuyên môn."
- Dòng in nghiêng: "*Bảng tin đầu tư được tổng hợp tự động bởi Grok AI lúc [Giờ hiện tại UTC+7]*"`;

        const userPrompt = `Hôm nay là ${dateStrFull}, phiên ${edition === 'AM' ? 'SÁNG' : 'CHIỀU'}.
NHIỆM VỤ: Bạn phải sử dụng Google Search để tìm kiếm chính xác các thông tin sau cho ngày hôm nay (${dateOnlyVN}):
1. "Giá xăng RON 95 Petrolimex ngày ${dateOnlyVN}"
2. "Giá vàng SJC hôm nay ngày ${dateOnlyVN}" và "Giá vàng thế giới spot USD/ounce hôm nay"
3. "Chỉ số VN-Index đóng cửa ngày ${dateOnlyVN}" (nếu là thứ 7/CN thì lấy phiên thứ 6 gần nhất)
4. "Giá thép Hòa Phát hôm nay ngày ${dateOnlyVN} tại TP.HCM"
5. "Tình hình bất động sản TP.HCM, Bình Dương, Đắk Lắk mới nhất tháng 3/2026"

Sau khi có dữ liệu, hãy lập bảng báo cáo. Tuyệt đối không để trống dữ liệu.`;

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const ai = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash',
            tools: [{ googleSearch: {} }] 
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000); // Timeout 55s

        const result = await ai.generateContent({
             contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }]
        }, { signal: controller.signal });

        clearTimeout(timeout);

        const newsContent = result.response.text();
        if (!newsContent) {
            throw new Error('Gemini không trả về nội dung.');
        }
        
        // Count approximate tokens (Gemini 2.5 flash uses character counting essentially or its own tokenizer, we can just estimate or leave it 0)
        let tokensUsed = 0;
        try {
             const { totalTokens } = await ai.countTokens(systemPrompt + '\n\n' + userPrompt);
             tokensUsed = totalTokens;
        } catch(e) {}

        // === LƯU VÀO SUPABASE ===
        const timeLabel = edition === 'AM' ? "Sáng" : "Chiều";
        const dateStrVN = dateVN.toLocaleDateString('vi-VN');
        const title = `Bảng Tin Đầu Tư ${timeLabel} ${dateStrVN}`;
        const editionDate = dateVN.toISOString().split('T')[0]; // YYYY-MM-DD

        const { error } = await supabaseAdmin.from('grok_news_feed').insert({
            title: title,
            content_markdown: newsContent,
            category: 'Đầu tư CEO',
            ai_model: 'gemini-2.0-flash (google_search)',
            edition: edition,
            edition_date: editionDate
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
