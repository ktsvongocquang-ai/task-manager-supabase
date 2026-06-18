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
4. Construction / Hồ sơ TC

Tiêu chuẩn thời gian thực tế (Ngày làm việc):
- Dự án Chung cư (ví dụ 100m2): Tổng thời gian 4 giai đoạn cộng lại chỉ khoảng 19 đến 22 ngày làm việc.
- Dự án Biệt thự/Nhà ở (ví dụ 150m2): Tổng thời gian 4 giai đoạn khoảng 30 đến 45 ngày làm việc.
- Dịch vụ/Thương mại: Tùy biến nhanh hơn hoặc tương đương.
Hãy tự động chia tỷ lệ ngày cho 4 giai đoạn sao cho tổng số ngày bám sát tiêu chuẩn trên (tăng giảm một chút theo diện tích thực tế).

Hãy trả về kết quả định dạng JSON array như sau, không kèm bất kỳ văn bản giải thích nào khác (không bọc trong markdown code block, trả về text thuần chuẩn JSON):
[
  { "phase": "Concept", "days": X },
  { "phase": "3D", "days": Y },
  { "phase": "Triển Khai", "days": Z },
  { "phase": "Construction / Hồ sơ TC", "days": W }
]
Trong đó X, Y, Z, W là số nguyên (số ngày ước tính hợp lý).`;

        let estimates;
        try {
            const result = await model.generateContent(prompt);
            let text = result.response.text();
            
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            estimates = JSON.parse(text);
        } catch (error) {
            console.log('Gemini API Failed, trying Grok (xAI) as fallback...');
            try {
                if (!process.env.XAI_API_KEY) throw new Error('No XAI_API_KEY found');
                
                const response = await fetch('https://api.x.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'grok-4.3',
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant that only responds with valid JSON arrays.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.1
                    })
                });
                
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`xAI error: ${response.status} ${response.statusText} - ${errText}`);
                }
                
                const data = await response.json();
                let text = data.choices[0].message.content;
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                estimates = JSON.parse(text);
                
            } catch (xaiError) {
                console.error('Both AI APIs Failed, using hardcoded fallback:', xaiError.message);
                estimates = [
                    { phase: "Concept", days: Math.max(3, Math.ceil(area / 40)) },
                    { phase: "3D", days: Math.max(4, Math.ceil(area / 20)) },
                    { phase: "Triển Khai", days: Math.max(5, Math.ceil(area / 15)) },
                    { phase: "Construction / Hồ sơ TC", days: Math.max(3, Math.ceil(area / 30)) }
                ];
            }
        }

        return res.status(200).json(estimates);
    } catch (error) {
        console.error('Error generating timeline:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
