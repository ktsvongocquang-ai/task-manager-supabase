import { GoogleGenAI, Type } from '@google/genai';

// Will initialize inside handler to avoid cold start missing env errors

// Helper: Generate a list of the next N working days (skipping weekends)
function getNextWorkingDays(startDateStr, numDays = 30) {
    const dates = [];
    let current = new Date(startDateStr);

    // If start date is invalid, fallback to today
    if (isNaN(current.getTime())) current = new Date();

    while (dates.length < numDays) {
        const dayOfWeek = current.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            dates.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const {
            projectName,
            clientName,
            startDate,
            leadName,
            supportName,
            projectType,
            style,
            investment,
            area
        } = req.body;

        if (!projectName || !startDate) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const ai = new GoogleGenAI({});

        // Generate a reference calendar so the LLM doesn't have to "guess" weekends
        const workingDaysCalendar = getNextWorkingDays(startDate, 40);

        // Define the strictly required output format for Tasks
        const taskSchema = {
            type: Type.OBJECT,
            properties: {
                code: { type: Type.STRING, description: "Mã công việc (VD: 1.1, 1.2, 2.1)" },
                title: { type: Type.STRING, description: "Tên công việc" },
                phase: { type: Type.STRING, description: "Giai đoạn (VD: Concept, 3D Render, Khớp nối kỹ thuật)" },
                startDate: { type: Type.STRING, description: "Ngày bắt đầu (YYYY-MM-DD)" },
                endDate: { type: Type.STRING, description: "Ngày kết thúc (YYYY-MM-DD)" },
                assignee: { type: Type.STRING, description: "Người phụ trách (Tên Lead hoặc Support)" },
                note: { type: Type.STRING, description: "Ghi chú thêm về task (nếu có)" }
            },
            required: ["code", "title", "phase", "startDate", "endDate", "assignee"]
        };

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                tasks: {
                    type: Type.ARRAY,
                    description: "Danh sách tuần tự các công việc (tasks) theo SOP workflow.",
                    items: taskSchema
                }
            },
            required: ["tasks"]
        };

        const systemInstruction = `
Bạn là một Giám đốc Quản lý Dự án Thiết kế Nội Thất / Kiến Trúc chuyên nghiệp.
Hệ thống yêu cầu bạn nạp thông tin dự án và tạo ra một bảng Tiến độ (Gantt Chart Tasks) chuẩn xác theo SOP (Standard Operating Procedure).

[INPUT TỪ HỆ THỐNG]
- Tên dự án: ${projectName}
- Khách hàng: ${clientName}
- Ngày bắt đầu: ${startDate}
- KTS Chủ trì (Lead): ${leadName}
- Người hỗ trợ (Support): ${supportName}
- Yêu cầu cấu hình: Loại hình ${projectType}, Phong cách ${style}, Mức đầu tư ${investment}, Diện tích ${area}m2

[BASE TEMPLATE WORKFLOW - BẮT BUỘC TRỌNG TÂM]
Hãy chia task theo luồng chuẩn sau đây (chỉnh bù trừ thời gian tùy theo diện tích/phong cách cho hợp lý):
Giai đoạn 1 (Concept/Layout):
- 1.1 Khảo sát hiện trạng & Đo đạc
- 1.2 Vẽ lại CAD hiện trạng
- 1.3 Lên Layout Mặt bằng 2D (2 Phương án)
- 1.4 Làm Moodboard & File trình bày Concept
- 1.5 Review nội bộ với Leader (Duyệt)
- 1.6 Gặp khách hàng & Ký chốt Layout (Buffer time)
Giai đoạn 2 (3D Render):
- 2.1 Dựng khung bao 3D
- 2.2 Model Nội thất chính
- 2.3 Decor & Chi tiết phụ
- 2.4 Ánh sáng (Lighting) & Vật liệu (Material)
- 2.5 Review nội bộ 3D với Leader
- 2.6 Gửi khách hàng xem 3D lần 1

[QUY TẮC QUAN TRỌNG VỀ NHÂN SỰ]
- Các task Dựng hình, Vẽ CAD, Decor thường do '${supportName}' (Support/Designer) làm.
- Các task Review, Lên Layout chính, Gặp khách, Lighting & Material thường do '${leadName}' (Lead) đảm nhiệm hoặc rà soát.
- Task chờ khách hàng (quyết định/duyệt) có thể gán cho "Khách hàng" (${clientName}).

[QUY TẮC LỊCH LÀM VIỆC (CỰC KỲ QUAN TRỌNG)]
Tuyệt đối KHÔNG gán startDate hay endDate vào Thứ 7 và Chủ Nhật.
Để giúp bạn tính toán chính xác tuyệt đối, đây là danh sách 40 NGÀY LÀM VIỆC TIẾP THEO (đã bỏ qua T7, CN) tính từ ngày bắt đầu (${startDate}):
${JSON.stringify(workingDaysCalendar)}
Hãy CHỈ sử dụng các ngày trong mảng trên cho startDate và endDate! Nếu một task kéo dài 3 ngày làm việc và bắt đầu vào index 0, endDate của nó sẽ là index 2.

Hãy suy luận số ngày thực tế dựa trên "Diện tích ${area}m2" và "Phong cách ${style}". Ví dụ Tân Cổ Điển sẽ tốn nhiều ngày Model hơn Hiện đại.
TRẢ VỀ DUY NHẤT 1 ARRAY JSON GỒM CÁC TASKS.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please generate the full project timeline tasks according to the strict SOP and Output Schema constraints based on the provided inputs.`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1, // Very low temperature for high precision and compliance
            }
        });

        const generatedData = JSON.parse(response.text);

        return res.status(200).json(generatedData);

    } catch (err) {
        console.error("Gemini Generation Error:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error during AI generation' });
    }
}
