import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

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
        const { taskTitle, taskDescription, dueDate, assigneeName, assigneeEmail, projectName } = req.body;

        if (!assigneeEmail) {
            return res.status(400).json({ error: 'Thiếu email người nhận.' });
        }
        if (!process.env.GEMINI_API_KEY || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'Thiếu cấu hình API Key hoặc thông tin Email trong biến môi trường.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const schema = {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING, description: "Tiêu đề của email (ngắn gọn, xúc tích, báo giao việc mới)." },
                bodyHtml: { type: Type.STRING, description: "Nội dung thân email được định dạng bằng HTML (sử dụng thẻ <p>, <ul>, <strong>... để trình bày đẹp mắt)." }
            },
            required: ["subject", "bodyHtml"]
        };

        const systemInstruction = `
Bạn là trợ lý ảo quản lý dự án đóng vai trò gửi email thông báo công việc mới.
Nhiệm vụ: Viết một email chuyên nghiệp, thân thiện để gửi tới nhân viên về công việc họ vừa nhận.
Email phải bao gồm lời chào, tóm tắt nhiệm vụ, thời hạn hoàn thành, và lời cảm ơn. Không dùng placeholder []. Thay vào đó dùng thông tin thực tế được cung cấp.
Phải định dạng kết quả dưới dạng JSON theo đúng schema, phần \`bodyHtml\` cần có định dạng HTML rõ ràng (xuống dòng bằng <br>, tô đậm text quan trọng).
`;

        let prompt = `Tên nhân sự: ${assigneeName || 'Bạn'}
Tên công việc: ${taskTitle}
Mô tả chi tiết: ${taskDescription || 'Không có mô tả thêm.'}
Hạn chót (Due date): ${dueDate || 'Không có hạn cụ thể'}
Dự án: ${projectName || 'Công việc nội bộ'}
Hãy viết email dựa trên các thông tin này.`;

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
            to: assigneeEmail,
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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local AI API server running on http://localhost:${PORT}`);
});
