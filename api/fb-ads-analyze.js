import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, fbToken, adAccountId, reportType } = req.body;

        if (!prompt || !fbToken || !adAccountId) {
            return res.status(400).json({ error: 'Thiếu thông tin prompt, fbToken hoặc adAccountId.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const currentDate = new Date().toISOString().split('T')[0];

        // Bước 1: Trích xuất tham số thời gian từ Prompt
        const schema = {
            type: Type.OBJECT,
            properties: {
                since: { type: Type.STRING, description: "Ngày bắt đầu theo chuẩn YYYY-MM-DD" },
                until: { type: Type.STRING, description: "Ngày kết thúc chuẩn YYYY-MM-DD" }
            },
            required: ["since", "until"]
        };

        const configPrompt = `Giao tiếp: Hôm nay là ${currentDate}. Dựa vào yêu cầu sau: "${prompt}". Hãy trích xuất khoảng thời gian (since, until) dạng YYYY-MM-DD. Mặc định nếu không ghi rõ là xem 7 ngày qua.`;
        
        const configResponse = await ai.getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContent({
            contents: [{ role: 'user', parts: [{ text: configPrompt }] }],
            generationConfig: {
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const timeRangeObj = JSON.parse(configResponse.response.text());
        const timeRangeStr = JSON.stringify({ since: timeRangeObj.since, until: timeRangeObj.until });

        // Bước 2: Gọi Facebook Graph API
        const fbUrl = `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=ad_name,campaign_name,spend,impressions,reach,clicks,cpc,cpm,ctr,actions,objective&level=ad&time_range=${encodeURIComponent(timeRangeStr)}&access_token=${fbToken}`;
        
        const fbResponse = await fetch(fbUrl);
        const fbData = await fbResponse.json();

        if (fbData.error) {
            throw new Error('Graph API Error: ' + fbData.error.message);
        }

        let adsDataRaw = fbData.data || [];
        
        if (adsDataRaw.length > 50) {
            adsDataRaw = adsDataRaw.sort((a,b) => (parseFloat(b.spend)||0) - (parseFloat(a.spend)||0)).slice(0, 50);
        }

        // Bước 3: Đưa dữ liệu thô vào LLM (Đóng vai Giám đốc Marketing)
        const analyzeInstruction = `
Bạn là một Giám Đốc Marketing (CMO) và Chuyên gia chạy Facebook Ads xuất sắc với 10 năm kinh nghiệm.
Nhiệm vụ: Dựa vào tập tin dữ liệu JSON (Facebook Ads Insights) trình bày chi tiết từng bài viết (ad) dưới đây, hãy:
1. Đánh giá tổng quan hiệu suất ngân sách và KPIs.
2. Đi sâu đánh giá từng bài viết cụ thể (bài nào đang "cắn" tiền ngon, bài đắt đỏ, bài nào mang lại leads/purchases thực tế tốt nhất, CPA bao nhiêu). Hãy tính toán từ JSON nếu cần (ví dụ: spend / leads).
3. ĐƯA RA LỜI KHUYÊN CHIẾN LƯỢC: Là Giám đốc, bạn quyết định nên tắt bài nào, dồn tiền bài nào, hay thay đổi nội dung gì?
Khung báo cáo: Chuyên nghiệp, dùng Format Markdown, rõ ràng như một báo cáo trình cấp trên. KHÔNG ĐƯỢC CHỨA CÚ PHÁP LỘ JSON thô.
`;
        
        const analysisPrompt = `
Yêu cầu của sếp: "${prompt}"
Khoảng thời gian đã quét: ${timeRangeStr}

DỮ LIỆU TỪ FACEBOOK ADS (CẤP ĐỘ TỪNG BÀI VIẾT QUẢNG CÁO):
${JSON.stringify(adsDataRaw)}
        `;

        const analysisResponse = await ai.getGenerativeModel({ 
            model: 'gemini-2.0-flash',
            systemInstruction: analyzeInstruction 
        }).generateContent(analysisPrompt);

        const aiAdvice = analysisResponse.response.text();

        // Bước 4: Lưu vào Supabase Dashboard
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
            try {
                const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                    auth: { autoRefreshToken: false, persistSession: false }
                });
                
                const metricsJson = adsDataRaw.slice(0, 10).map(ad => ({
                    name: (ad.ad_name || ad.campaign_name || 'Unknown').substring(0, 20) + '...',
                    spend: parseFloat(ad.spend) || 0,
                    impressions: parseInt(ad.impressions) || 0,
                    clicks: parseInt(ad.clicks) || 0,
                    ctr: parseFloat(ad.ctr) || 0,
                    cpc: parseFloat(ad.cpc) || 0,
                }));

                await supabaseAdmin.from('marketing_ai_reports').insert({
                    report_type: reportType || 'Tùy chỉnh',
                    ad_account_id: adAccountId,
                    date_range: timeRangeObj,
                    metrics_json: metricsJson,
                    ai_advice: aiAdvice
                });
            } catch (dbErr) {
                console.error("Lỗi khi lưu báo cáo vào DB:", dbErr);
            }
        }

        return res.status(200).json({ report: aiAdvice });

    } catch (err) {
        console.error("FB Ads AI Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi xử lý Facebook Ads.' });
    }
}
