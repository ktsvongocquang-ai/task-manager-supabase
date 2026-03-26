import express from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: "DQH AI Local Server is running!", time: new Date().toISOString() });
});

app.post('/api/refine-task', async (req, res) => {
    try {
        const { text, field } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Vui lòng cung cấp nội dung cần tinh chỉnh.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                refinedText: { type: SchemaType.STRING, description: "Nội dung đã được tinh chỉnh, chuyên nghiệp và súc tích." }
            },
            required: ["refinedText"]
        };

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const systemInstruction = `
[VAI TRÒ]
Bạn là chuyên gia quản lý dự án và biên tập nội dung chuyên nghiệp.

[NHIỆM VỤ]
Tinh chỉnh nội dung công việc (nhiệm vụ) từ bản nháp (thường là kết quả ghi âm bằng giọng nói) thành văn bản chuyên nghiệp, rõ ràng, súc tích và đúng ngữ pháp tiếng Việt.

[QUY TẮC]
1. Nếu field là 'name': Tạo tiêu đề ngắn gọn (dưới 10 từ), mang tính hành động.
2. Nếu field là 'description': Viết chi tiết hơn, liệt kê các ý chính nếu cần, giữ phong cách chuyên nghiệp.
3. Giữ nguyên các thông tin quan trọng như tên riêng, con số, thời hạn.
4. Trả về kết quả dưới dạng JSON theo đúng schema.
`;

        const prompt = `Hãy tinh chỉnh nội dung sau cho trường '${field || 'description'}': "${text}"`;

        const response = await ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: systemInstruction 
        }).generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const generatedData = JSON.parse(response.response.text());

        return res.status(200).json(generatedData);

    } catch (err) {
        console.error("AI Refine Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi khi AI tinh chỉnh nội dung.' });
    }
});

app.post('/api/send-ai-email', async (req, res) => {
    try {
        const { 
            to_email,
            subject,
            template_data
        } = req.body;

        if (!to_email) {
            return res.status(400).json({ error: 'Thiếu email người nhận.' });
        }
        if (!process.env.GEMINI_API_KEY || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'Thiếu cấu hình API Key hoặc thông tin Email trong biến môi trường.' });
        }

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                subject: { type: SchemaType.STRING, description: "Tiêu đề của email (ngắn gọn, xúc tích, ví dụ: [Task Manager] Bạn được giao công việc mới...)." },
                bodyHtml: { type: SchemaType.STRING, description: "Nội dung thân email được định dạng bằng HTML (sử dụng thẻ <p>, <ul>, <strong>... để trình bày đẹp mắt)." }
            },
            required: ["subject", "bodyHtml"]
        };

        const systemInstruction = `
Bạn là hệ thống tự động gửi email thông báo công việc.
Nhiệm vụ: Dựa vào thông tin JSON được cung cấp, hãy viết một email chuyên nghiệp, thiết kế đẹp mắt bằng HTML.
Trong email cần nhắc rõ: Người giao (actor_name), Hành động (action), Tên công việc, Dự án, Mức độ ưu tiên, Thời hạn, và có một nút CTA (Call to action) để "Xem chi tiết công việc" trỏ tới task_url.
Bắt buộc phải trả về định dạng JSON theo schema gồm subject và bodyHtml.
`;

        const prompt = JSON.stringify({
            to_email,
            subject: subject || `[Task Manager] Bạn được giao một công việc mới: ${template_data?.task_title}`,
            template_data
        }, null, 2);

        const response = await ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: systemInstruction 
        }).generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.3,
            }
        });

        const generatedData = JSON.parse(response.response.text());

        // Send Email via Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"DQH Hệ Thống Quản Lý" <${process.env.EMAIL_USER}>`,
            to: to_email,
            subject: generatedData.subject,
            html: generatedData.bodyHtml
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: 'Đã gửi email thành công!', aiGenerated: generatedData });

    } catch (err) {
        console.error("AI Email Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi khi tạo và gửi email.' });
    }
});

app.post('/api/fb-ads-analyze', async (req, res) => {
    try {
        const { prompt, fbToken, adAccountId, reportType } = req.body;

        if (!prompt || !fbToken || !adAccountId) {
            return res.status(400).json({ error: 'Thiếu thông tin prompt, fbToken hoặc adAccountId.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
        
        const configResponse = await ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash' 
        }).generateContent({
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

        const analysisResponse = await ai.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: analyzeInstruction
        }).generateContent({
            contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
            generationConfig: {
                temperature: 0.5,
            }
        });

        const aiAdvice = analysisResponse.response.text();

        // Bước 4: Lưu vào Supabase Dashboard
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
            try {
                const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                    auth: { autoRefreshToken: false, persistSession: false }
                });
                
                // Trích xuất các metrics quan trọng cho Dashboard (Top 10 Ads dựa vào Spend)
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
});

app.get('/api/fb-ads-reports', async (req, res) => {
    try {
        const { adAccountId } = req.query;
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return res.status(500).json({ error: 'Thiếu cấu hình Supabase Admin trong biến môi trường.' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        let query = supabaseAdmin.from('marketing_ai_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (adAccountId) {
            query = query.eq('ad_account_id', adAccountId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return res.status(200).json({ reports: data });
    } catch (err) {
        console.error("Lỗi khi lấy lịch sử báo cáo:", err);
        return res.status(500).json({ error: err.message || 'Lỗi server.' });
    }
});


app.post('/api/admin', async (req, res) => {
    try {
        const { action, payload } = req.body;
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return res.status(500).json({ error: 'Missing Supabase Admin credentials.' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        if (action === 'update_password') {
            const { userId, newPassword } = payload;
            if (!userId || !newPassword) return res.status(400).json({ error: 'Missing userId or newPassword' });
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else if (action === 'create_user') {
            const { email, password, full_name } = payload;
            if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
            const { data, error } = await supabaseAdmin.auth.signUp({
                email, password, options: { data: { full_name } }
            });
            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else if (action === 'update_email') {
            const { userId, newEmail } = payload;
            if (!userId || !newEmail) return res.status(400).json({ error: 'Missing userId or newEmail' });
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                email: newEmail, email_confirm: true
            });
            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else if (action === 'auto_provision_profile') {
            const { id, email, full_name, role, staff_id, position } = payload;
            
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .insert({ id, email, full_name, role, staff_id, position })
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, profile: data });
        }

        else return res.status(400).json({ error: 'Unknown action' });

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

app.get('/api/generate-grok-news', async (req, res) => {
    try {
        console.log("[Grok Local] Bắt đầu tổng hợp tin tức...");
        const xaiApiKey = process.env.XAI_API_KEY;
        if (!xaiApiKey) {
            return res.status(500).json({ error: 'Missing XAI_API_KEY in server environment.' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
             return res.status(500).json({ error: 'Missing Supabase credentials.' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

        // Chống trùng lặp
        const now = new Date();
        const vnHour = (now.getUTCHours() + 7) % 24;
        const edition = vnHour < 12 ? 'AM' : 'PM';
        const todayStr = now.toISOString().split('T')[0];

        const { data: existing } = await supabaseAdmin
            .from('grok_news_feed')
            .select('id')
            .gte('created_at', `${todayStr}T00:00:00Z`)
            .eq('edition', edition)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(200).json({ success: true, message: `Bản tin ${edition} hôm nay đã có sẵn.`, skipped: true });
        }

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
            model: "grok-3-mini", stream: false, temperature: 0.3
        };

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${xaiApiKey}` }, body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`xAI API Error: ${response.status} - ${await response.text()}`);

        const xaiData = await response.json();
        const newsContent = xaiData.choices[0].message.content;
        const tokensUsed = xaiData.usage?.total_tokens || 0;

        const timeLabel = edition === 'AM' ? "Sáng" : "Chiều";
        const dateStrVN = new Date(now.getTime() + 7 * 60 * 60 * 1000).toLocaleDateString('vi-VN');
        const title = `Bản tin Vĩ mô ${timeLabel} ${dateStrVN}`;

        await supabaseAdmin.from('grok_news_feed').insert({
            title, content_markdown: newsContent, category: 'Tổng hợp', ai_model: 'grok-3-mini', edition
        });

        console.log(`[Grok Local] Thành công! Tokens: ${tokensUsed}`);
        return res.status(200).json({ success: true, message: 'Đã tổng hợp tin tức thành công', title, tokens_used: tokensUsed });
    } catch (err) {
        console.error("[Grok Local] Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi xử lý tạo tin tức.' });
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local AI API server running on http://0.0.0.0:${PORT}`);
});
