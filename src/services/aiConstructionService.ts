export interface GeneratedTask {
  name: string;
  category: 'PHẦN THÔ' | 'ĐIỆN NƯỚC' | 'HOÀN THIỆN' | 'KHÁC';
  budget: number;
  days: number;
  dependencies: number[]; // Index of dependencies in this returned list
  checklist: string[];
}

const API_BASE = '/api/analyze-quotation';

async function callAPI(body: object) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

export const aiConstructionService = {
  /**
   * Phân tích báo giá thô / hợp đồng và tạo danh sách tiến độ tasks.
   */
  async generateTimelineFromQuotation(quotationText: string): Promise<GeneratedTask[]> {
    const data = await callAPI({ mode: 'timeline', text: quotationText });
    return (data.tasks || []) as GeneratedTask[];
  },

  /**
   * Đánh giá rủi ro và tiến độ tự động (local fallback — no API needed)
   */
  async analyzeProjectState(projectContext: any): Promise<any> {
    try {
      const data = await callAPI({ mode: 'projectState', context: projectContext });
      return data.alerts || [];
    } catch {
      return [];
    }
  },

  /**
   * Phân tích file PDF (base64) hoặc ảnh bằng Gemini multimodal
   */
  async analyzeFileMultimodal(base64Data: string, mimeType: string): Promise<{
    tasks: GeneratedTask[];
    projectInfo: { name: string; ownerName: string; address: string; contractValue: number; budget: number; startDate: string; handoverDate: string; };
  }> {
    const data = await callAPI({ mode: 'multimodal', base64: base64Data, mimeType });
    return {
      tasks: data.tasks || [],
      projectInfo: data.projectInfo || { name: '', ownerName: '', address: '', contractValue: 0, budget: 0, startDate: '', handoverDate: '' }
    };
  },

  /**
   * Trích xuất thông tin dự án từ text thuần
   */
  async extractProjectInfo(text: string): Promise<{
    name: string; ownerName: string; address: string; contractValue: number; budget: number; startDate: string; handoverDate: string;
  }> {
    const data = await callAPI({ mode: 'projectInfo', text });
    return data.projectInfo || {};
  }
};
