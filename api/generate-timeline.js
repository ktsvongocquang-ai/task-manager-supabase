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

Tiêu chuẩn thời gian thực tế (Ngày làm việc) cho dự án chuẩn 100m2:
- Loại hình Chung cư: Tổng thời gian 4 giai đoạn cộng lại khoảng 19 đến 22 ngày làm việc.
- Loại hình Nhà ở (Nhà phố/Biệt thự): Hệ số 1.2 so với Chung cư (tổng khoảng 23-26 ngày).
- Loại hình Dịch vụ (Shop/Cửa hàng): Hệ số 0.8 so với Chung cư (tổng khoảng 15-18 ngày).

Hãy dựa vào tỷ lệ hệ số trên và [Diện tích thực tế] để chia số ngày cho 4 giai đoạn sao cho hợp lý nhất. Nếu diện tích lớn hơn 100m2 thì tăng ngày lên tương ứng.

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
                
                let typeMultiplier = 1.0;
                if (projectType === 'Nhà ở' || projectType === 'Biệt thự' || projectType.toLowerCase().includes('nhà')) typeMultiplier = 1.2;
                else if (projectType === 'Dịch vụ' || projectType === 'Shop' || projectType.toLowerCase().includes('dịch')) typeMultiplier = 0.8;

                const areaScale = Math.pow(area / 100, 0.6); 
                const totalScale = typeMultiplier * areaScale;

                estimates = [
                    { phase: "Concept", days: Math.max(2, Math.round(4 * totalScale)) },
                    { phase: "3D", days: Math.max(3, Math.round(6 * totalScale)) },
                    { phase: "Triển Khai", days: Math.max(4, Math.round(7 * totalScale)) },
                    { phase: "Construction / Hồ sơ TC", days: Math.max(2, Math.round(4 * totalScale)) }
                ];
            }
        }

        return res.status(200).json(estimates);
    } catch (error) {
        console.error('Error generating timeline:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
