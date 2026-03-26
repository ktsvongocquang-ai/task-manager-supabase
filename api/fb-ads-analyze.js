import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let { prompt, fbToken, adAccountId, reportType } = req.body;
        
        if (adAccountId && !adAccountId.startsWith('act_')) {
            adAccountId = 'act_' + adAccountId;
        }

        if (!prompt || !fbToken || !adAccountId) {
            return res.status(400).json({ error: 'Thiếu thông tin prompt, fbToken hoặc adAccountId.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const ai = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const currentDate = new Date().toISOString().split('T')[0];

        // Bước 1: Trích xuất tham số thời gian từ Prompt
        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                since: { type: SchemaType.STRING, description: "Ngày bắt đầu theo chuẩn YYYY-MM-DD" },
                until: { type: SchemaType.STRING, description: "Ngày kết thúc chuẩn YYYY-MM-DD" }
            },
            required: ["since", "until"]
        };

        const configPrompt = `Giao tiếp: Hôm nay là ${currentDate}. Dựa vào yêu cầu sau: "${prompt}". Hãy trích xuất khoảng thời gian (since, until) dạng YYYY-MM-DD. Mặc định nếu không ghi rõ là xem 7 ngày qua.`;
        
        const configResponse = await ai.generateContent({
            contents: [{ role: 'user', parts: [{ text: configPrompt }] }],
            generationConfig: {
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const timeRangeObj = JSON.parse(configResponse.response.text());
        const timeRangeStr = JSON.stringify({ since: timeRangeObj.since, until: timeRangeObj.until });

        // Bước 2: Gọi Facebook Graph API (Lấy dữ liệu tổng quan các Ads)
        const fbUrl = `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=ad_name,campaign_name,spend,impressions,reach,clicks,cpc,cpm,ctr,actions,objective&level=ad&time_range=${encodeURIComponent(timeRangeStr)}&access_token=${fbToken}`;
        
        // Bước 2.5: Gọi API thứ 2 (Lấy dữ liệu phân tách theo Nhân khẩu học - Demographics)
        const demoUrl = `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=ad_name,spend,actions&level=ad&breakdowns=age,region&time_range=${encodeURIComponent(timeRangeStr)}&access_token=${fbToken}`;

        const [fbResponse, demoResponse] = await Promise.all([
            fetch(fbUrl),
            fetch(demoUrl)
        ]);

        const fbData = await fbResponse.json();
        const demoData = await demoResponse.json();

        if (fbData.error) {
            throw new Error('Graph API Error: ' + fbData.error.message);
        }

        let adsDataRaw = fbData.data || [];
        if (adsDataRaw.length > 50) {
            adsDataRaw = adsDataRaw.sort((a,b) => (parseFloat(b.spend)||0) - (parseFloat(a.spend)||0)).slice(0, 50);
        }

        let demoDataRaw = demoData.data || [];
        if (demoDataRaw.length > 30) {
            // Lọc ra Top 30 phân khúc (độ tuổi/khu vực) tốn nhiều tiền nhất để AI phân tích
            demoDataRaw = demoDataRaw.sort((a,b) => (parseFloat(b.spend)||0) - (parseFloat(a.spend)||0)).slice(0, 30);
        }

        // Bước 3: Đưa dữ liệu thô vào LLM (Đóng vai Giám đốc Marketing)
        const analyzeInstruction = `
Bạn là một Giám Đốc Marketing (CMO) và Chuyên gia chạy Facebook Ads xuất sắc với 10 năm kinh nghiệm.
Nhiệm vụ: Dựa vào tập tin dữ liệu JSON (Facebook Ads Insights) trình bày chi tiết từng bài viết (ad) bao gồm các chỉ số chuẩn (Spend, CPM, CTR) và phân tích Nhân khẩu học (Demographics: Độ tuổi, Khu vực).
Hãy:
1. Đánh giá tổng quan hiệu suất ngân sách và KPIs toàn chiến dịch dựa trên Data Tổng.
2. Đi sâu đánh giá từng bài viết cụ thể: bài nào đang có giá Tin nhắn (Cost per Message) rẻ, bài nào có tỷ lệ chuyển đổi cao.
3. PHÂN TÍCH NHÂN KHẨU HỌC: Dựa vào Data Demographics, hãy chỉ ra Độ tuổi nào và Khu vực (Region) nào đang tương tác/tạo ra chuyển đổi tốt nhất (rẻ nhất) cho từng bài quảng cáo.
4. ĐƯA RA LỜI KHUYÊN CHIẾN LƯỢC: Là Giám đốc, bạn quyết định nên tắt bài nào, dồn tiền bài nào? Có nên đổi target (độ tuổi, vùng miền) không?
Khung báo cáo: Chuyên nghiệp, dùng Format Markdown, rõ ràng như một báo cáo trình cấp trên. KHÔNG ĐƯỢC CHỨA CÚ PHÁP LỘ JSON thô.
`;
        
        const analysisPrompt = `
Yêu cầu của sếp: "${prompt}"
Khoảng thời gian đã quét: ${timeRangeStr}

1. DỮ LIỆU TỔNG QUAN FACEBOOK ADS (TOP 50 ADS):
${JSON.stringify(adsDataRaw)}

2. DỮ LIỆU NHÂN KHẨU HỌC (TOP 30 PHÂN KHÚC ĐỘ TUỔI/KHU VỰC):
${JSON.stringify(demoDataRaw)}
        `;

        const analysisResponse = await genAI.getGenerativeModel({ 
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
                
                const metricsJson = adsDataRaw.slice(0, 10).map(ad => {
                    const actions = ad.actions || [];
                    const getAction = (type) => {
                        const action = actions.find(a => a.action_type === type);
                        return action ? parseInt(action.value) : 0;
                    };

                    const messages = getAction('onsite_conversion.messaging_first_reply') + getAction('messaging_conversation_started_7d');
                    const linkClicks = getAction('link_click');
                    const postEngagements = getAction('post_engagement');
                    const leads = getAction('lead') + getAction('onsite_conversion.lead_grouped');

                    return {
                        name: (ad.ad_name || ad.campaign_name || 'No Name').substring(0, 20),
                        spend: parseFloat(ad.spend) || 0,
                        impressions: parseInt(ad.impressions) || 0,
                        reach: parseInt(ad.reach) || 0,
                        clicks: parseInt(ad.clicks) || linkClicks || 0,
                        ctr: parseFloat(ad.ctr) || 0,
                        cpc: parseFloat(ad.cpc) || 0,
                        messages: messages,
                        post_engagements: postEngagements,
                        leads: leads
                    };
                });

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
