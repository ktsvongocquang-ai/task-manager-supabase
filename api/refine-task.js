import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { text, field } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Vui lòng cung cấp nội dung cần tinh chỉnh.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: 'application/json',
            }
        });

        const schema = {
            type: Type.OBJECT,
            properties: {
                refinedText: { type: Type.STRING, description: "Nội dung đã được tinh chỉnh, chuyên nghiệp và súc tích." }
            },
            required: ["refinedText"]
        };

        const systemInstruction = `
[VAI TRÒ]
Bạn là chuyên gia quản lý dự án và biên tập nội dung chuyên nghiệp.

[NHIỆM VỤ]
Tinh chỉnh nội dung công việc (nhiệm vụ) từ bản nháp (thường là kết quả ghi âm bằng giọng nói) thành văn bản chuyên nghiệp, rõ ràng, súc tích và đúng ngữ pháp tiếng Việt.

[QUY TẮC]
1. Nếu field là 'name': Tạo tiêu đề ngắn gọn (dưới 10 từ), mang tính hành động.
2. If field là 'description': Viết chi tiết hơn, liệt kê các ý chính nếu cần, giữ phong cách chuyên nghiệp.
3. Giữ nguyên các thông tin quan trọng như tên riêng, con số, thời hạn.
4. Trả về kết quả dưới dạng JSON theo đúng schema.
`;

        const prompt = `Hãy tinh chỉnh nội dung sau cho trường '${field || 'description'}': "${text}"`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
            systemInstruction: systemInstruction
        });

        const generatedData = JSON.parse(result.response.text());

        return res.status(200).json(generatedData);

    } catch (err) {
        console.error("AI Refine Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi khi AI tinh chỉnh nội dung.' });
    }
}
