import { GoogleGenAI, Type } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
// Lazy initialization to prevent fatal crash when API key is missing on Vercel
let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    if (!apiKey) throw new Error("Missing Gemini API Key. Please set VITE_GEMINI_API_KEY in your environment.");
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

export interface GeneratedTask {
  name: string;
  category: 'PHẦN THÔ' | 'ĐIỆN NƯỚC' | 'HOÀN THIỆN' | 'KHÁC';
  budget: number;
  days: number;
  dependencies: number[]; // Index of dependencies in this returned list
  checklist: string[];
}

export const aiConstructionService = {
  /**
   * Phân tích báo giá thô / hợp đồng và tạo danh sách tiến độ tasks.
   */
  async generateTimelineFromQuotation(quotationText: string): Promise<GeneratedTask[]> {
    try {
      if (!apiKey) throw new Error("Missing Gemini API Key in .env");

      const prompt = `Bạn là một Kỹ sư trưởng Xây dựng xuất sắc. Dưới đây là nội dung báo giá/hợp đồng xây dựng thô:
---
${quotationText}
---
Hãy bóc tách thành một danh sách các công việc (tasks) bao gồm: phần móng, phần thân, điện nước, hoàn thiện. 
Tự động ước tính thời gian thi công hợp lý (days) và chi phí (budget) nếu có. Nếu không có giá, hãy tự nội suy tỉ lệ % ngân sách hợp lý theo tiêu chuẩn thị trường (giả định tổng là 1 tỷ, hoặc theo giá trị trong text). 
Mỗi task phải có checklist nghiệm thu cụ thể (2-3 items).
Thiết lập dependencies: Hạng mục sau phụ thuộc vào hạng mục trước (bằng chỉ số mảng 0-indexed). Ví dụ Móng (0) xong tới Cột (1) -> dependencies của (1) là [0].

Trả về MỘT MẢNG JSON hợp quy chuẩn với cấu trúc:
[{
  "name": "string",
  "category": "PHẦN THÔ" | "ĐIỆN NƯỚC" | "HOÀN THIỆN" | "KHÁC",
  "budget": number,
  "days": number,
  "dependencies": number[],
  "checklist": string[]
}]`;

      const response = await getAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['PHẦN THÔ', 'ĐIỆN NƯỚC', 'HOÀN THIỆN', 'KHÁC'] },
                budget: { type: Type.INTEGER },
                days: { type: Type.INTEGER },
                dependencies: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['name', 'category', 'budget', 'days', 'dependencies', 'checklist']
            }
          }
        }
      });

      if (!response.text) throw new Error("No response from AI");
      const generatedTasks = JSON.parse(response.text);
      return generatedTasks as GeneratedTask[];
      
    } catch (e) {
      console.error("AI Timeline Generation failed:", e);
      throw e;
    }
  },

  /**
   * Đánh giá rủi ro và tiến độ tự động
   */
  async analyzeProjectState(projectContext: any): Promise<any> {
    try {
        const prompt = `Dưới vai trò Quản lý dự án AI, hãy phân tích tình trạng hiện tại của dự án:
        ${JSON.stringify(projectContext)}
        
        Nếu bị trễ hẹn, hãy đưa ra cảnh báo 'DELAY'. Nếu vượt ngân sách, hãy cảnh báo 'BUDGET'. Đưa ra 'SUGGESTION' (Đề xuất) ngắn gọn giải quyết.
        Trả về JSON mảng tối đa 2 phần tử:
        [{ "type": "DELAY|BUDGET|SUGGESTION", "message": "Nội dung ngắn gọn", "priority": "HIGH|MEDIUM|LOW" }]`;
  
        const response = await getAI().models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
             responseMimeType: 'application/json',
             responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: {type: Type.STRING},
                        message: {type: Type.STRING},
                        priority: {type: Type.STRING}
                    }
                }
             }
          }
        });
        return JSON.parse(response.text || '[]');
    } catch(e) {
        console.error("AI Analysis failed:", e);
        return [];
    }
  }
};
