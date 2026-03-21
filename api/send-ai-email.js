import { GoogleGenAI, Type } from '@google/genai';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

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
}
