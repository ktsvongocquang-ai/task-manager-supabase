import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { area, projectType } = req.body;

        if (!area || !projectType) {
            return res.status(400).json({ error: 'Missing required parameters: area, projectType' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Bạn là một chuyên gia quản lý dự án Kiến trúc và Nội thất (Project Manager).
Bạn cần dự đoán số ngày làm việc (days) hợp lý cho 4 giai đoạn nối tiếp nhau của một dự án, dựa trên các thông số sau:
- Diện tích: ${area} m2
- Loại hình dự án: ${projectType}

4 giai đoạn bắt buộc:
1. Concept
2. 3D
3. Triển Khai
4. Báo Giá - Thi Công

Hãy trả về kết quả định dạng JSON array như sau, không kèm bất kỳ văn bản giải thích nào khác (không bọc trong markdown code block, trả về text thuần chuẩn JSON):
[
  { "phase": "Concept", "days": X },
  { "phase": "3D", "days": Y },
  { "phase": "Triển Khai", "days": Z },
  { "phase": "Báo Giá - Thi Công", "days": W }
]
Trong đó X, Y, Z, W là số nguyên (số ngày ước tính hợp lý).`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Clean up markdown block if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let estimates;
        try {
            estimates = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse Gemini response:', text);
            // Fallback estimates if AI fails parsing
            estimates = [
                { phase: "Concept", days: 3 },
                { phase: "3D", days: Math.ceil(area / 50) + 2 },
                { phase: "Triển Khai", days: Math.ceil(area / 40) + 2 },
                { phase: "Báo Giá - Thi Công", days: 3 }
            ];
        }

        return res.status(200).json(estimates);
    } catch (error) {
        console.error('Error generating timeline:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
