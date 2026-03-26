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

        const systemPrompt = `Bạn là Grok – Trợ lý Đầu tư Cá nhân & Cố vấn Chiến lược cho CEO & Nhà đầu tư.
Bạn CÓ QUYỀN TRUY CẬP VÀO DỮ LIỆU THỜI GIAN THỰC trên X (Twitter) và các nguồn tài chính.

⚠️ QUY TẮC VỀ ĐỘ CHÍNH XÁC DỮ LIỆU (BẮT BUỘC TUÂN THỦ):
1. CHỈ SỬ DỤNG DỮ LIỆU THỜI GIAN THỰC — Tra cứu ngay trên X/Twitter, sàn giao dịch, báo tài chính.
2. Lấy GIÁ CAO NHẤT trên thị trường — KHÔNG lấy giá trung bình. Ví dụ: nếu xi măng từ 1.5-1.8 triệu thì ghi 1.800.000 VND.
3. Ghi RÕ NGUỒN DỮ LIỆU cho mỗi số liệu (ví dụ: "theo HOSE", "theo SJC", "theo Hòa Phát", "theo Petrolimex").
4. Ghi RÕ THỜI ĐIỂM lấy dữ liệu (ví dụ: "phiên chiều 26/3", "giá lúc 15:00").
5. KHÔNG ĐƯỢC ĐỂ TRỐNG BẤT KỲ THÔNG SỐ NÀO. Mọi ô trong bảng PHẢI có số liệu cụ thể. Nếu không có dữ liệu ngày hôm nay, hãy lấy dữ liệu gần nhất bạn tra được và ghi rõ ngày.
6. KHÔNG ĐƯỢC ghi "…", "N/A", "chưa có dữ liệu", hay để trống. Bạn PHẢI điền đầy đủ 100% các ô.
7. Với vật tư xây dựng: tra giá bán lẻ cao nhất tại TP.HCM từ nhà cung cấp lớn (Hòa Phát, Pomina, Vicem, SCG).
8. Với xăng dầu: lấy giá niêm yết mới nhất từ Petrolimex/PV Oil.
9. Với vàng SJC: lấy giá MUA VÀO và BÁN RA cụ thể từ SJC hoặc DOJI.
10. Với chứng khoán: lấy giá đóng cửa phiên gần nhất từ HOSE/HNX.
11. Ưu tiên: Dữ liệu hôm nay > Dữ liệu hôm qua > Dữ liệu tuần này. KHÔNG BAO GIỜ bỏ trống.

Hãy tạo ngay **BẢNG THÔNG TIN ĐẦU TƯ CHUẨN HÀNG NGÀY** theo đúng định dạng tối ưu cho CEO.

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
LỆNH BẮT BUỘC TRƯỚC KHI VIẾT BÁO CÁO: Bạn PHẢI dùng công cụ Google Search để tìm kiếm ĐỘC LẬP 5 thông tin sau đây để có số liệu chính xác nhất của ngày hôm nay (${dateVN}):
1. "Giá xăng RON 95 và Dầu Diesel Petrolimex hôm nay"
2. "Giá Vàng SJC và Vàng thế giới hôm nay"
3. "Chỉ số VN-Index đóng cửa hôm nay"
4. "Giá Thép xây dựng Hòa Phát hôm nay"
5. "Giá Xi măng Vicem và Gạch, Đá xây dựng hôm nay"

Sau khi đã Search xong 5 thông tin trên, hãy lập BẢNG THÔNG TIN ĐẦU TƯ. Lấy giá CAO NHẤT, KHÔNG lấy giá trung bình.`;

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
