import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ParsedBOQItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  days: number;
  category: string;
}

export const parseConstructionExcel = async (rawData: any[][]): Promise<ParsedBOQItem[]> => {
  if (!API_KEY) {
    console.warn("GEMINI_API_KEY is missing. Using heuristic fallback.");
    return fallbackHeuristic(rawData);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Bạn là một chuyên gia bóc tách khối lượng (BOQ) và lập tiến độ thi công nội thất 20 năm kinh nghiệm.
      Dưới đây là mảng dữ liệu thô trích xuất từ file Excel báo giá thi công. 
      
      NHIỆM VỤ:
      1. Lọc và chỉ giữ lại các dòng là "Hệ mục công việc" thực tế (có tên công việc, đơn vị tính, số lượng, đơn giá). Loại bỏ các dòng tiêu đề chung, ghi chú, trang trí.
      2. Trích xuất đúng các trường: Tên hạng mục, Đơn vị tính (ĐVT), Số lượng, Đơn giá.
      3. TƯ DUY LOGIC THI CÔNG & PHÂN NHÓM:
         Phân loại mỗi hạng mục vào một trong các nhóm chuẩn sau (Ghi HOA chính xác):
         - "1. CÔNG TÁC CHUẨN BỊ TRƯỚC THI CÔNG"
         - "2. HẠNG MỤC CẢI TẠO KIẾN TRÚC"
         - "3. HẠNG MỤC LẮP ĐẶT NỘI THẤT"
         - "4. NGHIỆM THU NỘI BỘ - DEFECT"
         - "5. NGHIỆM THU BÀN GIAO KHÁCH HÀNG"

         Ước tính số ngày thi công (days) cho mỗi hạng mục:
         - Hạng mục thô/cải tạo (xây chát, tháo dỡ): 2-5 ngày tùy khối lượng.
         - Hạng mục lắp đặt nội thất: 1-2 ngày/hạng mục.
         - Hạng mục sơn bả/hoàn thiện: 3-5 ngày.
      
      DỮ LIỆU ĐẦU VÀO (JSON):
      ${JSON.stringify(rawData.slice(0, 150))}

      YÊU CẦU ĐẦU RA (CHỈ TRẢ VỀ JSON array):
      [
        {
          "id": "chuỗi ngẫu nhiên",
          "name": "Tên hạng mục",
          "unit": "ĐVT",
          "quantity": số,
          "price": số,
          "days": số ngày thi công ưóc tính,
          "category": "Tên nhóm chuẩn ở trên"
        }
      ]
      Không được giải thích gì thêm ngoài JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean code block markdown if present
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return fallbackHeuristic(rawData);
  }
};

const fallbackHeuristic = (json: any[][]): ParsedBOQItem[] => {
  const extractedData: ParsedBOQItem[] = [];
  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    if (!row || row.length < 3) continue;
    
    const strings = row.filter(cell => typeof cell === 'string');
    const numbers = row.filter(cell => typeof cell === 'number');
    
    if (strings.length > 0) {
      const name = strings.find(s => s.length > 5) || strings[0] || 'Chưa rõ tên';
      if (name.includes('Cám ơn') || name.includes('Kính gửi') || name.length < 3) continue;

      const unitStr = strings.find(s => ['m2', 'm3', 'md', 'cái', 'bộ', 'gói', 'm²', 'bộ', 'hệ'].includes(s.toLowerCase()));
      const unit = unitStr || 'gói';
      
      const price = numbers.length > 0 ? Math.max(...numbers) : 1000000;
      const quantity = numbers.length > 1 ? Math.min(...numbers.filter(n => n > 0)) : 1;

      // Logic Timeline Heuristic
      let days = 2;
      let category = 'THI CÔNG';
      
      const lowerName = name.toLowerCase();
      if (lowerName.includes('cán') || lowerName.includes('lát') || lowerName.includes('xây')) {
        days = Math.max(2, Math.ceil(quantity / 20));
        category = 'THI CÔNG (THÔ)';
      } else if (lowerName.includes('sơn') || lowerName.includes('ốp') || lowerName.includes('trần')) {
        days = 3;
        category = 'HOÀN THIỆN';
      } else if (lowerName.includes('tủ') || lowerName.includes('bàn') || lowerName.includes('giường') || lowerName.includes('cửa')) {
        days = 1;
        category = 'NỘI THẤT';
      }

      extractedData.push({
        id: `b_${Date.now()}_${i}`,
        name: name,
        unit: unit,
        quantity: quantity,
        price: price,
        days: days,
        category: category
      });
    }
  }
  return extractedData;
};
