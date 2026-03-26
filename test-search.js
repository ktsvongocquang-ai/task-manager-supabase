import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const ai = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    tools: [{ googleSearch: {} }] 
});

async function test() {
    console.log("Testing massive search grounding...");
    const prompt = `Hôm nay là ngày 26/3/2026. Lệnh: Hãy dùng công cụ Google Search để tìm kiếm 3 loại thông tin độc lập sau:
1. Giá xăng RON 95 của Petrolimex Việt Nam ngày hôm nay.
2. Giá Thép cuộn D10 CB300 Hòa Phát ngày hôm nay.
3. Chỉ số VN-Index đóng cửa ngày hôm nay.

BÁO CÁO KẾT QUẢ RÕ RÀNG.`;
    const res = await ai.generateContent(prompt);
    console.log("Result:", res.response.text());
}
test();
