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
                phaseId: { type: Type.STRING, description: "ID của Giai đoạn (VD: concept, 3d, technic, deliver)" },
                start: { type: Type.STRING, description: "Ngày bắt đầu (YYYY-MM-DD)" },
                end: { type: Type.STRING, description: "Ngày kết thúc (YYYY-MM-DD)" },
                assignee: { type: Type.STRING, description: "Người phụ trách (Tên Lead hoặc Support)" },
                duration: { type: Type.INTEGER, description: "Thời lượng công việc tính bằng ngày" },
                note: { type: Type.STRING, description: "Ghi chú thêm về task (mặc định rỗng)" }
            },
            required: ["code", "title", "phaseId", "start", "end", "assignee", "duration"]
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
[VAI TRÒ & NHIỆM VỤ]
Bạn là một AI Project Manager cấp cao chuyên lập kế hoạch dự án Thiết kế Nội thất theo chuẩn SOP cực kỳ khắt khe của JFLOW.
Nhiệm vụ của bạn là nhận thông tin đầu vào của dự án và sinh ra một Lịch trình JSON chuẩn xác.

[RÀNG BUỘC TỐI THƯỢNG - CRITICAL RULES]
1. KHÔNG ĐƯỢC LƯỜI BIẾNG. KHÔNG ĐƯỢC TÓM TẮT. KHÔNG ĐƯỢC DÙNG "...".
2. BẠN BẮT BUỘC PHẢI TRẢ VỀ MẢNG JSON CHỨA ĐÚNG VÀ ĐỦ 44 TASKS BÊN DƯỚI. Nếu thiếu dù chỉ 1 task, hệ thống sẽ bị lỗi.
3. KỸ THUẬT GỐI ĐẦU (OVERLAPPING): Các task vẽ kỹ thuật (3.1 -> 3.5) PHẢI CÓ ngày bắt đầu trùng với ngày bắt đầu của task Chờ phản hồi (3.0). Không được cộng dồn ngày.

[THÔNG TIN DỰ ÁN]
- Tên dự án: ${projectName}
- Khách hàng: ${clientName}
- Vai trò: Lead = '${leadName}', Support = '${supportName}'

[WORKFLOW CHUẨN ĐÚNG 44 TASKS - BẮT BUỘC RÁP THEO MÃ NÀY]
DAY 1: 1.1 (Khảo sát Tường), 1.2 (Khảo sát Trần/Dầm), 1.3 (Định vị ME), 1.4 (Chụp ảnh), 1.5 (Vẽ CAD hiện trạng), 1.6 (Layout PA1), 1.7 (Layout PA2)
DAY 2: 1.8 (Tìm Moodboard), 1.9 (Soạn trình bày), 1.10 (Gặp khách & Ký duyệt)
DAY 3: 2.1 (Dựng khung bao), 2.2 (Model P.Khách)
DAY 4: 2.3 (Model Bếp)
DAY 5: 2.4 (Model Master), 2.5 (Model Ngủ Con), 2.6 (Khu phụ)
DAY 6: 2.7 (Decor), 2.8 (Ánh sáng), 2.9 (Vật liệu), 2.10 (Camera), 2.11 (Batch Render)
DAY 7: 2.12 (Hậu kỳ PTS), 2.13 (Gửi khách 3D Lần 1)
DAY 8: 3.0 (Chờ KH phản hồi - Kéo dài 2 ngày), 3.1 (MB bố trí nội thất - Gối đầu)
DAY 9: 3.2 (MB Xây tường), 3.3 (MB Lát sàn), 3.4 (MB Trần đèn), 3.5 (MB Ổ cắm)
DAY 10: 3.6 (Trao đổi sửa đổi), 3.7 (Tổng hợp Word)
DAY 11: 3.8 (Sửa Model 3D), 3.9 (Gửi Final 3D)
DAY 12: 3.10 (Chờ KH chốt vật liệu - Kéo dài 1 ngày), 4.1 (Bổ đồ gỗ P.Khách - Gối đầu)
DAY 14: 4.2 (Bổ đồ Bếp), 4.3 (Bổ Ngủ), 4.4 (Bổ WC)
DAY 15: 4.5 (Dim kích thước)
DAY 16: 4.6 (Ghi chú quy cách), 4.7 (Trích xuất 3D), 4.8 (Thống kê khối lượng)
DAY 17: 5.1 (Tự check QC), 5.2 (Leader check), 5.3 (Sửa lỗi theo Leader)
DAY 18: 5.4 (Xuất hồ sơ in), 5.5 (Đóng gói Server)
DAY 19: 6.1 (Khởi động dự án tiếp theo)

[QUY TẮC TÍNH NGÀY CỦA AI CỰC KỲ CHÍNH XÁC]
- Start Date của mỗi task = (DAY của task đó - 1) Lấy index trong mảng Calendar bên dưới.
- Ví dụ task ở DAY 1 -> Index 0. Task ở DAY 4 -> Index 3. 
- MỘT SỐ NGOẠI LỆ: 
   + Task 3.0 (Chờ KH phản hồi) ở DAY 8 (Index 7), kéo dài 2 ngày nên End Date = Index 8.
   + Task 3.1 (MB Bố trí) nằm ở DAY 8 (Index 7), có duration mặc định 1 ngày nên End Date = Index 7. 
   + LƯU Ý: DAY 13 BỊ NHẢY CÓC. Nghĩa là task DAY 14 -> Index 13.
Đây là mảng Calendar chứa danh sách các ngày làm việc (đã bỏ qua T7, CN):
${JSON.stringify(workingDaysCalendar)}
Tuyệt đối KHÔNG gán startDate hay endDate nào nằm ngoài các chuỗi ngày trong mảng trên.

[QUY TẮC GÁN NGƯỜI (ASSIGNEE)]
- Assignee: Các task vẽ Layout, Render, Ánh sáng, Gặp khách, Leader check -> Gán cho '${leadName}'. Các task bổ CAD, Dựng hình thô, QC nội bộ -> Gán cho '${supportName}'. Các task Chờ phản hồi -> Gán cho '${clientName}'.

CHỈ ĐƯỢC PHÉP TRẢ VỀ JSON ARRAY CHỨA ĐÚNG VÀ ĐỦ TOÀN BỘ 44 OBJECT TASKS.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Tạo Gantt Chart JSON array gồm 44 tasks theo đúng quy định gối đầu và bỏ qua ngày nghỉ:",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.05,
            }
        });

        const generatedData = JSON.parse(response.text);

        return res.status(200).json(generatedData);

    } catch (err) {
        console.error("Gemini Generation Error:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error during AI generation' });
    }
}
