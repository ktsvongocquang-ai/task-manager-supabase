import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
            type: Type.OBJECT,
            properties: {
                refinedText: { type: Type.STRING, description: "Nội dung đã được tinh chỉnh, chuyên nghiệp và súc tích." }
            },
            required: ["refinedText"]
        };

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Assuming GEMINI_API_KEY is defined in .env

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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt],
            config: {
                systemInstruction: systemInstruction,
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const generatedData = JSON.parse(response.text);

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

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const schema = {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING, description: "Tiêu đề của email (ngắn gọn, xúc tích, ví dụ: [Task Manager] Bạn được giao công việc mới...)." },
                bodyHtml: { type: Type.STRING, description: "Nội dung thân email được định dạng bằng HTML (sử dụng thẻ <p>, <ul>, <strong>... để trình bày đẹp mắt)." }
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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt],
            config: {
                systemInstruction: systemInstruction,
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.3,
            }
        });

        const generatedData = JSON.parse(response.text);

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
        
        const configResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [configPrompt],
            config: {
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const timeRangeObj = JSON.parse(configResponse.text);
        const timeRangeStr = JSON.stringify({ since: timeRangeObj.since, until: timeRangeObj.until });

        // Bước 2: Gọi Facebook Graph API (Lấy cấp độ Ad để phân tích chi tiết từng bài viết)
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

        const analysisResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [analysisPrompt],
            config: {
                systemInstruction: analyzeInstruction,
                temperature: 0.5,
            }
        });

        const aiAdvice = analysisResponse.text;

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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local AI API server running on http://localhost:${PORT}`);
});
