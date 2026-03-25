import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { 
            to_email,
            subject: inputSubject,
            template_data
        } = req.body;

        if (!to_email) {
            return res.status(400).json({ error: 'Thiếu email người nhận.' });
        }
        if (!process.env.GEMINI_API_KEY || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'Thiếu cấu hình API Key hoặc thông tin Email trong biến môi trường.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                subject: { type: SchemaType.STRING, description: "Tiêu đề của email (ngắn gọn, xúc tích)." },
                bodyHtml: { type: SchemaType.STRING, description: "Nội dung thân email được định dạng bằng HTML." }
            },
            required: ["subject", "bodyHtml"]
        };

        const systemInstruction = `
            Bạn là một trợ lý AI viết email chuyên nghiệp cho công ty kiến trúc/thi công nội thất.
            Hãy viết một email lịch sự dựa trên dữ liệu công việc (template_data).
            Email được gửi từ hệ thống JFLOW.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `Dữ liệu: ${JSON.stringify(template_data)}` }] }],
            generationConfig: {
                systemInstruction: systemInstruction,
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const generatedData = JSON.parse(result.response.text());

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"JFLOW System" <${process.env.EMAIL_USER}>`,
            to: to_email,
            subject: generatedData.subject || inputSubject || 'Thông báo từ JFLOW',
            html: generatedData.bodyHtml,
        });

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("Gemini Email Error:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
