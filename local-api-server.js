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

        else return res.status(400).json({ error: 'Unknown action' });

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local AI API server running on http://localhost:${PORT}`);
});
