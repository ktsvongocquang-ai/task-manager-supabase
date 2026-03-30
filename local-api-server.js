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

// ── ANALYZE QUOTATION (Construction AI Timeline) ──
app.post('/api/analyze-quotation', async (req, res) => {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server' });
        }

        const { mode, text, base64, mimeType } = req.body || {};
        if (!mode) {
            return res.status(400).json({ error: 'Missing mode (timeline | multimodal | projectInfo)' });
        }

        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // --- Mode 1: Generate timeline from text ---
        if (mode === 'timeline') {
            if (!text) return res.status(400).json({ error: 'Missing text' });

            const prompt = `Bạn là một Kỹ sư trưởng Xây dựng xuất sắc. Dưới đây là nội dung báo giá/hợp đồng xây dựng thô:
---
${text}
---
Hãy bóc tách thành một danh sách các công việc (tasks) bao gồm: phần móng, phần thân, điện nước, hoàn thiện.
Tự động ước tính thời gian thi công hợp lý (days) và chi phí (budget) nếu có. Nếu không có giá, hãy tự nội suy tỉ lệ % ngân sách hợp lý theo tiêu chuẩn thị trường (giả định tổng là 1 tỷ, hoặc theo giá trị trong text).
Mỗi task phải có checklist nghiệm thu cụ thể (2-3 items).
Thiết lập dependencies: Hạng mục sau phụ thuộc vào hạng mục trước (bằng chỉ số mảng 0-indexed).

Trả về MỘT MẢNG JSON với cấu trúc:
[{
  "name": "string",
  "category": "PHẦN THÔ" | "ĐIỆN NƯỚC" | "HOÀN THIỆN" | "KHÁC",
  "budget": number,
  "days": number,
  "startDate": "YYYY-MM-DD",
  "dependencies": number[],
  "checklist": string[]
}]
Lưu ý: "startDate" là ngày bắt đầu thực tế của mỗi hạng mục. Nếu file có THỜI GIAN bắt đầu, dùng ngày đó. Nếu không có, tính dựa theo dependencies.`;

            const response = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
            });

            const tasks = JSON.parse(response.response.text() || '[]');
            return res.status(200).json({ tasks });
        }

        // --- Mode 2: Analyze PDF/image multimodal ---
        if (mode === 'multimodal') {
            if (!base64 || !mimeType) return res.status(400).json({ error: 'Missing base64 or mimeType' });

            const prompt = `Bạn là Kỹ sư trưởng Xây dựng. Đây là file báo giá/hợp đồng xây dựng.
Hãy phân tích và trích xuất:
1. Thông tin dự án: Tên công trình, Chủ nhà, Địa chỉ, Giá trị hợp đồng, Ngân sách, Ngày khởi công, Ngày bàn giao.
2. Danh sách công việc thi công: mỗi hạng mục gồm tên, loại, chi phí, thời gian, checklist nghiệm thu.

Trả về JSON với cấu trúc:
{
  "projectInfo": { "name": "", "ownerName": "", "address": "", "contractValue": 0, "budget": 0, "startDate": "YYYY-MM-DD", "handoverDate": "YYYY-MM-DD" },
  "tasks": [{ "name": "", "category": "PHẦN THÔ|ĐIỆN NƯỚC|HOÀN THIỆN|KHÁC", "budget": 0, "days": 0, "startDate": "YYYY-MM-DD", "dependencies": [], "checklist": [""] }]
}
Lưu ý quan trọng:
- Mỗi task PHẢI có "startDate" chính xác (ngày bắt đầu) nếu có trong file.
- Nếu file hiển thị cột THỜI GIAN bắt đầu, dùng ngày đó.
- Nếu không tìm thấy, tính dựa theo dependencies và ngày khởi công.
Nếu không tìm thấy thông tin nào, hãy điền giá trị hợp lý dựa trên ngữ cảnh.`;

            const response = await model.generateContent({
                contents: [{ role: 'user', parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: prompt }
                ]}],
                generationConfig: { responseMimeType: 'application/json' }
            });

            const raw = JSON.parse(response.response.text() || '{}');
            return res.status(200).json({ tasks: raw.tasks || [], projectInfo: raw.projectInfo || {} });
        }

        // --- Mode 3: Extract project info from text ---
        if (mode === 'projectInfo') {
            if (!text) return res.status(400).json({ error: 'Missing text' });

            const response = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `Từ nội dung báo giá/hợp đồng này, trích xuất thông tin dự án:\n---\n${text.slice(0, 3000)}\n---\nTrả về JSON: { "name": "", "ownerName": "", "address": "", "contractValue": 0, "budget": 0, "startDate": "YYYY-MM-DD", "handoverDate": "YYYY-MM-DD" }. Nếu không rõ, hãy suy luận hợp lý.` }] }],
                generationConfig: { responseMimeType: 'application/json' }
            });

            const projectInfo = JSON.parse(response.response.text() || '{}');
            return res.status(200).json({ projectInfo });
        }

        return res.status(400).json({ error: `Unknown mode: ${mode}` });

    } catch (e) {
        console.error('analyze-quotation error:', e);
        return res.status(500).json({ error: e.message || 'AI analysis failed' });
    }
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
            model: 'gemini-3-flash-preview',
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
            model: 'gemini-3-flash-preview',
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
            model: 'gemini-3-flash-preview' 
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
            model: 'gemini-3-flash-preview',
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
        console.log("[Gemini Local] Bắt đầu tổng hợp tin tức...");
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

        const now = new Date();
        const vnHour = (now.getUTCHours() + 7) % 24;
        const edition = vnHour < 12 ? 'AM' : 'PM';
        const todayStr = now.toISOString().split('T')[0];
        const forceRegenerate = req.query?.force === 'true';

        const { data: existing } = await supabaseAdmin
            .from('grok_news_feed')
            .select('id')
            .gte('created_at', `${todayStr}T00:00:00Z`)
            .eq('edition', edition)
            .limit(1);

        if (existing && existing.length > 0) {
            if (forceRegenerate) {
                await supabaseAdmin.from('grok_news_feed').delete().eq('id', existing[0].id);
                console.log(`[Gemini] Force regenerate: đã xóa bản tin ${edition} cũ.`);
            } else {
                console.log(`[Gemini Local] Bản tin ${edition} ngày ${todayStr} đã tồn tại. Bỏ qua.`);
                return res.status(200).json({ success: true, message: `Bản tin ${edition} hôm nay đã có sẵn, không cần tạo mới.`, skipped: true });
            }
        }

        const dateVN = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const dateStrFull = dateVN.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const dateOnlyVN = dateVN.toISOString().split('T')[0]; // YYYY-MM-DD

        const systemPrompt = `Bạn là Giám đốc Phân tích Đầu tư (CIO) cấp cao.
Bạn CÓ QUYỀN TRUY CẬP VÀO DỮ LIỆU THỜI GIAN THỰC qua Google Search.

🔴 QUY TẮC BẮT BUỘC (TRUY TÌM SỰ THẬT - CHỈ DÙNG NĂM 2026):
1. TUYỆT ĐỐI KHÔNG HÀNH ĐỘNG THEO TRÍ NHỚ (TRAINING DATA). Mọi con số phải đến từ kết quả Search của năm 2026.
2. ĐỐI SOÁT NĂM: Khi Search, AI phải kiểm tra kỹ ngày tháng năm của bài báo. Nếu bài báo không ghi năm 2026, TUYỆT ĐỐI KHÔNG lấy số liệu đó (tránh lấy nhầm giá 90-95 triệu của năm 2024/2025).
3. QUY TẮC CUỐI TUẦW: Vì hôm nay là Thứ Bảy (${dateStrFull}), nếu không tìm thấy giá niêm yết mới của hôm nay, BẮT BUỘC lấy giá chốt phiên Thứ Sáu ngày 27/03/2026. TUYỆT ĐỐI KHÔNG được tự ý điền con số lạ.
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

BƯỚC 1 - KIỂM CHỨNG & SUY NGHĨ (BẮT BUỘC):
Trước khi tạo bảng, bạn PHẢI phân tích dữ liệu search được vào trong thẻ <SUY_NGHĨ>...</SUY_NGHĨ>.
Quy định thẻ <SUY_NGHĨ>:
- Ghi rõ Nguồn, Ngày tháng bài báo, và Con số tìm được.
- Nếu bài báo là của năm 2024 hoặc 2025 (ví dụ vàng 90-95 triệu), bạn phải TỪ CHỐI và tiếp tục tìm lại hoặc ghi chú rõ là số liệu cũ. PHẢI dùng số liệu của năm 2026 (quanh mốc 170 triệu).
- Ví dụ:
<SUY_NGHĨ>
- Vàng SJC: Tìm thấy bài báo ngày 28/03/2026. Giá mua 170 / Bán 172. 
- VN-Index: Hôm nay Thứ Bảy, lấy giá chốt ngày hôm qua 27/03/2026 là 1.412 điểm. 
</SUY_NGHĨ>

BƯỚC 2: SAU KHI PHÂN TÍCH XONG, mới in ra Báo cáo Markdown bắt đầu từ "## 📊 EXECUTIVE SUMMARY". Tuyệt đối không để trống dữ liệu.`;

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const ai = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            tools: [{ googleSearch: {} }] 
        });

        // Khởi tạo timeout 55s tương tự production
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000);

        const result = await ai.generateContent({
             contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }]
        }, { signal: controller.signal });

        clearTimeout(timeout);

        const newsContentRaw = result.response.text();
        
        // Loại bỏ thẻ SUY_NGHI trước khi lưu vào DB
        const newsContent = newsContentRaw.replace(/<SUY_NGHĨ>[\s\S]*?<\/SUY_NGHĨ>/gi, '').trim();

        let tokensUsed = 0;
        try {
             const { totalTokens } = await ai.countTokens(systemPrompt + '\n\n' + userPrompt);
             tokensUsed = totalTokens;
        } catch(e) {}

        const timeLabel = edition === 'AM' ? "Sáng" : "Chiều";
        const dateStrVN = dateVN.toLocaleDateString('vi-VN');
        const title = `Bảng Tin Đầu Tư ${timeLabel} ${dateStrVN}`;
        const editionDate = dateVN.toISOString().split('T')[0];

        const { error } = await supabaseAdmin.from('grok_news_feed').insert({
            title: title,
            content_markdown: newsContent,
            category: 'Đầu tư CEO',
            ai_model: 'gemini-2.5-flash (google_search)',
            edition: edition,
            edition_date: editionDate
        });

        if (error) throw error;

        console.log(`[Gemini Local] Thành công! Tokens: ${tokensUsed}`);
        return res.status(200).json({ success: true, message: 'Đã tổng hợp tin tức thành công', title, tokens_used: tokensUsed });

    } catch (err) {
        console.error("[Gemini Local] Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi xử lý tạo tin tức.' });
    }
});

app.get('/api/backup-db', async (req, res) => {
    try {
        console.log("[Backup] Đang chuẩn bị sao lưu dữ liệu...");
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return res.status(500).json({ error: 'Missing Supabase credentials.' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const tables = [
            'profiles',
            'projects',
            'tasks',
            'comments',
            'notifications',
            'marketing_ai_reports',
            'grok_news_feed',
            'global_messages'
        ];

        const backupData = {
            timestamp: new Date().toISOString(),
            version: "1.0",
            tables: {}
        };

        // Fetch data from each table
        for (const table of tables) {
            console.log(`[Backup] Đang lấy dữ liệu từ bảng: ${table}...`);
            const { data, error } = await supabaseAdmin.from(table).select('*');
            
            if (error) {
                console.error(`[Backup] Lỗi khi lấy dữ liệu bảng ${table}:`, error);
                backupData.tables[table] = { error: error.message };
            } else {
                backupData.tables[table] = data;
                console.log(`[Backup] Đã lấy ${data.length} bản ghi từ ${table}.`);
            }
        }

        const fileName = `supabase_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.status(200).send(JSON.stringify(backupData, null, 2));

    } catch (err) {
        console.error("[Backup] Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi khi sao lưu dữ liệu.' });
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local AI API server running on http://0.0.0.0:${PORT}`);
});
