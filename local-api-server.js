import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import cors from 'cors';
import dotenv from 'dotenv';

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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local AI API server running on http://localhost:${PORT}`);
});
