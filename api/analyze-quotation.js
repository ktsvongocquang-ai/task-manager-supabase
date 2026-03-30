import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server' });
  }

  const { mode, text, base64, mimeType } = req.body || {};

  if (!mode) {
    return res.status(400).json({ error: 'Missing mode (timeline | multimodal | projectInfo)' });
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    // --- Mode 1: Generate timeline from text ---
    if (mode === 'timeline') {
      if (!text) return res.status(400).json({ error: 'Missing text' });

      const prompt = `Bạn là một Kỹ sư trưởng Xây dựng xuất sắc. Dưới đây là nội dung báo giá/hợp đồng xây dựng thô:
---
${text}
---
Hãy bóc tách thành một danh sách các công việc (tasks) bao gồm: phần móng, phần thân, điện nước, hoàn thiện.
Tự động ước tính thời gian thi công hợp lý (days) và chi phí (budget) nếu có. Nếu không có giá, hãy tự nội suy tỉ lệ % ngân sách hợp lý theo tiêu chuẩn thị trường (giả định tổng là 1 tỷ, hoặc theo giá trị trong text).
Mỗi task phải có checklist nghiệm thu cụ thể (2-3 items).
Thiết lập dependencies: Hạng mục sau phụ thuộc vào hạng mục trước (bằng chỉ số mảng 0-indexed).

Trích xuất cẩn thận 'startDate' (ngày bắt đầu của task). NẾU text có khoảng thời gian như '10/04/2026 - 15/04/2026', ngày bắt đầu là '2026-04-10'. Định dạng BẮT BUỘC là YYYY-MM-DD. NẾU không có ngày bắt đầu, để rỗng "".
Trả về MỘT MẢNG JSON với cấu trúc:
[{
  "name": "string",
  "category": "PHẦN THÔ" | "ĐIỆN NƯỚC" | "HOÀN THIỆN" | "KHÁC",
  "budget": number,
  "days": number,
  "startDate": "YYYY-MM-DD",
  "dependencies": number[],
  "checklist": string[]
}]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const tasks = JSON.parse(response.text || '[]');
      return res.status(200).json({ tasks });
    }

    // --- Mode 2: Analyze PDF/image multimodal ---
    if (mode === 'multimodal') {
      if (!base64 || !mimeType) return res.status(400).json({ error: 'Missing base64 or mimeType' });

      const prompt = `Bạn là Kỹ sư trưởng Xây dựng. Đây là file báo giá/hợp đồng xây dựng.
Hãy phân tích và trích xuất:
1. Thông tin dự án: Tên công trình, Chủ nhà, Địa chỉ, Giá trị hợp đồng, Ngân sách, Ngày khởi công, Ngày bàn giao.
2. Danh sách công việc thi công: mỗi hạng mục gồm tên, loại, chi phí, thời gian, checklist nghiệm thu.

Trả về JSON với cấu trúc:
{
  "projectInfo": {
    "name": "Tên công trình",
    "ownerName": "Tên chủ nhà",
    "address": "Địa chỉ",
    "contractValue": 0,
    "budget": 0,
    "startDate": "YYYY-MM-DD",
    "handoverDate": "YYYY-MM-DD"
  },
  "tasks": [
    {
      "name": "string",
      "category": "PHẦN THÔ|ĐIỆN NƯỚC|HOÀN THIỆN|KHÁC",
      "budget": 0,
      "days": 0,
      "startDate": "YYYY-MM-DD",
      "dependencies": [],
      "checklist": ["string"]
    }
  ]
}
Chú ý: startDate bắt buộc convert sang chuẩn YYYY-MM-DD (vidu: 2026-04-15). Nếu không rõ hoặc không có, để rỗng "". Đoán số 'days' nếu không có nhưng có ngày kết thúc. Nếu không tìm thấy thông tin nào, hãy để rỗng hoặc ước tính tỷ lệ chuẩn.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt }
          ]}
        ],
        config: { responseMimeType: 'application/json' }
      });

      const raw = JSON.parse(response.text || '{}');
      return res.status(200).json({
        tasks: raw.tasks || [],
        projectInfo: raw.projectInfo || {}
      });
    }

    // --- Mode 3: Extract project info from text ---
    if (mode === 'projectInfo') {
      if (!text) return res.status(400).json({ error: 'Missing text' });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Từ nội dung báo giá/hợp đồng này, trích xuất thông tin dự án:\n---\n${text.slice(0, 3000)}\n---\nTrả về JSON: { "name": "", "ownerName": "", "address": "", "contractValue": 0, "budget": 0, "startDate": "YYYY-MM-DD", "handoverDate": "YYYY-MM-DD" }. NHỚ: startDate và handoverDate phải format dạng YYYY-MM-DD. Nếu không rỗ, để rỗng "".`,
        config: { responseMimeType: 'application/json' }
      });

      const projectInfo = JSON.parse(response.text || '{}');
      return res.status(200).json({ projectInfo });
    }

    return res.status(400).json({ error: `Unknown mode: ${mode}` });

  } catch (e) {
    console.error('analyze-quotation error:', e);
    return res.status(500).json({ error: e.message || 'AI analysis failed' });
  }
}
