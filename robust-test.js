import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const ai = genAI.getGenerativeModel({ 
    model: 'gemini-3-flash-preview',
    tools: [{ googleSearch: {} }] 
});

async function testMultiple() {
    const prompt = `Hôm nay là ngày 26/03/2026. LỆNH TỐI MẬT: BẠN PHẢI SỬ DỤNG GOOGLE SEARCH ĐỂ KIỂM CHỨNG TỪNG CON SỐ MỘT.

QUY TẮC LẤY SỐ LIỆU ĐỂ KHÔNG BỊ SAI LỆCH VỚI ĐỈNH LỊCH SỬ HAY DỰ BÁO:
1. Xăng Dầu: TÌM GIÁ BÁN LẺ NIÊM YẾT VÙNG 1 của Petrolimex ngày hôm nay. (Không lấy đỉnh cũ, không lấy giá dự báo).
2. Vật tư xây dựng (Thép, Xi măng, Cát, Đá): Nếu bài báo cung cấp 1 "KHOẢNG GIÁ" (ví dụ: 15.000 - 18.000), BẠN BẮT BUỘC CHỌN SỐ CAO NHẤT CỦA CÁI KHOẢNG ĐÓ (18.000). NHƯNG TUYỆT ĐỐI KHÔNG dùng mức giá của các bài dự báo tương lai hoặc lịch sử.

HÃY SEARCH VÀ TRẢ LỜI NGẮN GỌN NHẤT:
- Xăng RON 95-III Vùng 1 hôm nay: [Giá]
- Xăng RON 95-V Vùng 1 hôm nay: [Giá]
- Dầu Diesel 0.05S Vùng 1 hôm nay: [Giá]
- Thép thanh vằn D10 CB300 Hòa Phát hôm nay: [Giá]
`;
    console.log("Fetching new robust prompt...");
    const res = await ai.generateContent(prompt);
    console.log(res.response.text());
}

testMultiple();
