import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt, imageBase64 } = req.body;

        if (!prompt && !imageBase64) {
            return res.status(400).json({ error: 'Vui lòng cung cấp mô tả dự án hoặc hình ảnh tham khảo.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                projectName: { type: SchemaType.STRING, description: "Tên dự án AI tóm tắt được (VD: Căn hộ Vin, Nhà phố ABCD...)" },
                clientName: { type: SchemaType.STRING, description: "Tên khách hàng tóm tắt được, nếu có (VD: Anh Nam, Chị Nữ). Nếu không thấy để trống." },
                projectType: { type: SchemaType.STRING, description: "Phân loại dự án sát nhất trong các giá trị sau: 'Chung cư', 'Nhà phố - Cải tạo', 'Nhà phố - Xây mới', 'Biệt thự', 'Thương mại - Dịch vụ (Shop/F&B)', 'Văn phòng'. Nếu không có, hãy để 'Chung cư'." },
                style: { type: SchemaType.STRING, description: "Phong cách thiết kế trong: 'Hiện đại (Modern)', 'Tân cổ điển (Neo-classic)', 'Wabi Sabi', 'Indochine', 'Minimalism', 'Luxury'. Nếu không có, hãy để 'Hiện đại (Modern)'." },
                area: { type: SchemaType.STRING, description: "Diện tích m2 là SỐ nguyên. AI hãy dự đoán nếu có bản vẽ, hoặc bóc tách từ Text. (Mặc định 100 nếu không đoán được)." },
                complexity: { type: SchemaType.STRING, description: "Đánh giá sơ bộ độ phức tạp dựa trên bản vẽ (VD: Khó, Nhiều P.Ngủ, Bình thường, Đơn giản...)" },
                estimatedDays: { type: SchemaType.INTEGER, description: "SỐ NGUYÊN. Số ngày làm việc dự kiến nộp file HOÀN THIỆN mà KTS/AI tư vấn. Nếu user nói '15 ngày phải xong', hãy trả về 15. Tối đa không quá 60 ngày. Trả về null nếu không ép cứng số ngày." },
                aiMessage: { type: SchemaType.STRING, description: "Câu trả lời thân thiện (khoảng 2-3 câu ngắn) phân tích cho user, ví dụ: 'Dựa vào mặt bằng đính kèm (khoảng chừng 90m2 với 3 PN) và đoạn chat, tôi đề xuất lộ trình làm việc khoảng 25 ngày làm việc do tính chất phong cách Wabi Sabi mất khá nhiều thời gian dựng vật liệu...' " },
                contextNote: { type: SchemaType.STRING, description: "Bất kỳ yêu cầu/ghi chú đặc biệt nào khác của người dùng để truyền lại cho bước tạo tiến độ (VD: Khách yêu cầu vẽ nhanh 3 ngày...)." }
            },
            required: ["projectName", "clientName", "projectType", "style", "area", "complexity", "aiMessage", "contextNote"]
        };

        const contents = [];

        if (prompt) {
            contents.push({ text: prompt });
        }

        if (imageBase64) {
            let mimeType = 'image/jpeg';
            let base64Data = imageBase64;

            if (imageBase64.includes('data:image/')) {
                const parts = imageBase64.split(';');
                mimeType = parts[0].split(':')[1];
                base64Data = parts[1].replace('base64,', '');
            }

            contents.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        const systemInstruction = `
[VAI TRÒ CỦA AI]
Bạn là Kiến trúc sư kiêm Trợ lý AI Quản lý Dự Án JFLOW (AI Project Manager).
Nhiệm vụ của bạn là nhận thông tin đầu vào (gồm Hội thoại văn bản và/hoặc Ảnh mặt bằng Layout) từ User, sau đó ĐỌC HIỂU và trích xuất thông tin định tuyến (routing info) ra cấu trúc JSON để phần mềm tự động điền Form Khởi tạo.

[HƯỚNG DẪN ĐỌC ẢNH & CHAT MÔ TẢ]
1. TƯ DUY KIẾN TRÚC SƯ: Nếu người dùng gửi ảnh Layout Mặt Bằng:
   - Hãy đếm số phòng ngủ/WC, nhìn diện tích phòng/kích thước hệ trục để ước lượng xấp xỉ "area" m2 (Ví dụ thấy 2 PN thì chừng 60-80m2, 3PN thì 90-120m2, nhà ống thì chừng 5x20...), nếu trong ảnh có ghi chữ số thì lấy text đó.
   - Ước lượng độ phức tạp "complexity" (VD: Dễ vẽ vì vuông vức, Khó vì đập tường nhiều...).
2. TRÍCH XUẤT THÔNG TIN TỪ CHAT:
   - Nhặt ra tên khách (nếu có), ví dụ "Làm cho anh Nam" -> "Anh Nam".
   - Nhặt loại hình: Nếu user nói "căn hộ" / "chung cư" -> Chung cư. Nếu nói "nhà thô" -> Nhà phố. Nếu nói "quán cà phê" -> Thương mại - Dịch vụ (Shop/F&B).
   - Nhặt phong cách chuẩn nhất với từ khóa user cung cấp.
3. PHẢN HỒI (aiMessage) VÀ SỐ NGÀY DỰ KIẾN (estimatedDays):
   - Hãy đóng vai KTS giao tiếp thân thiện. Bắt đầu bằng việc xác nhận bạn đã tiếp nhận yêu cầu (Ví dụ: "Chào bạn, tôi đã nhận được mặt bằng và mô tả thiết kế căn Wabi Sabi của anh Nam.").
   - Nêu một nhận định CHUYÊN MÔN về cái mặt bằng (VD: "Mặt bằng 3 ngủ này khá vuông vức nhưng layout bếp đang hơi hẹp...").
   - Đưa ra 1 gợi ý về TIMELINE dựa trên dữ kiện, hoặc DỰA TRÊN YÊU CẦU ÉP TIẾN ĐỘ của user (VD: user bảo làm 15 ngày thì bạn phải báo: "...tôi nhất trí lộ trình làm việc gói gọn trong 15 ngày như bạn mong muốn...").
   - QUAN TRỌNG: Con số ngày bạn vừa nói trong chat BẮT BUỘC phải được trích xuất thành SỐ NGUYÊN và gán vào trường "estimatedDays"!
4. Tất cả mọi "chỉ đạo" của user (như "yêu cầu vẽ nhanh", "vẽ thật kỹ phòng master", v.v) BẮT BUỘC nhét hết vào trường 'contextNote' để truyền xuống con AI sinh WBS.

[HƯỚNG DẪN GIẢI QUYẾT BÀI TOÁN QUẢN TRỊ (PROMPT BẮT BUỘC)]
Nếu người dùng cung cấp thông tin "Doanh thu" (hoặc ngân sách thiết kế, ví dụ: 20tr) và "Diện tích" (ví dụ: 150m2), BẠN TỰ ĐỘNG GIẢI QUYẾT BÀI TOÁN QUẢN TRỊ như mẫu sau và đưa TOÀN BỘ chi tiết diễn giải vào 'aiMessage':
1. Quỹ lương tối đa (50%): Lấy [Doanh thu x 50%]. Ví dụ: 20.000.000 x 50% = 10.000.000 VNĐ.
2. Số ngày làm việc tối đa: Lấy [Quỹ lương tối đa / 600.000 VNĐ]. Ví dụ: 10.000.000 / 600.000 = ~16.6 ngày (Làm tròn thành 16 ngày). 
   --> LUÔN GÁN ĐÚNG Số ngày này vào trường "estimatedDays".
3. KPI Năng suất (Quan trọng): Lấy [Diện tích / Số ngày]. Ví dụ: 150m2 / 16 ngày = ~9.3 m2/ngày. Ghép nguyên văn câu sau vào lời khuyên: "Nghĩa là anh/chị giao việc thẳng cho nhân sự: 'Với dự án này, mỗi ngày em phải chốt xong khối lượng tương đương [X]m2 sàn. Chậm hơn mức này là đang lố thời gian của công ty'".
4. Phân bổ Timeline: Chia thời lượng ra theo chuẩn sau (trên tổng số ngày, VD 16 ngày):
   - Concept: ~18.75% (Ví dụ: ~3 ngày)
   - 3D: ~40.625% (Ví dụ: ~6.5 ngày)
   - Tender: ~31.25% (Ví dụ: ~5 ngày)
   - Construction: ~9.375% (Ví dụ: ~1.5 ngày)
   --> YÊU CẦU: Nhét số liệu Phân bổ Timeline chính xác này vào 'contextNote' để làm base tính toán cho AI sinh WBS phía sau.`;

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-3-flash-preview',
            systemInstruction: systemInstruction
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: contents }],
            generationConfig: {
                responseSchema: schema,
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const generatedData = JSON.parse(result.response.text());
        return res.status(200).json(generatedData);

    } catch (err) {
        console.error("Gemini Analysis Error:", err);
        return res.status(500).json({ error: err.message || 'Lỗi khi AI phân tích dự án.' });
    }
}
