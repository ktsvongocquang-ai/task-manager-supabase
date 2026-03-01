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

        // Define the strictly required output format for Phases
        const phaseSchema = {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "ID của Giai đoạn (VD: GD1, GD2, GD3, GD4, GD5)" },
                name: { type: Type.STRING, description: "Tên Giai đoạn (VD: Concept & Chốt Layout)" },
                start: { type: Type.STRING, description: "Ngày bắt đầu Giai đoạn (YYYY-MM-DD)" },
                end: { type: Type.STRING, description: "Ngày kết thúc Giai đoạn (YYYY-MM-DD)" }
            },
            required: ["id", "name", "start", "end"]
        };

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                phases: {
                    type: Type.ARRAY,
                    description: "Danh sách 5 Giai đoạn chính (Phases/Parent Tasks)",
                    items: phaseSchema
                },
                tasks: {
                    type: Type.ARRAY,
                    description: "Danh sách chi tiết các công việc (Child Tasks) thuộc các Phases.",
                    items: taskSchema
                }
            },
            required: ["phases", "tasks"]
        };

        const systemInstruction = `
[VAI TRÒ & NHIỆM VỤ]
Bạn là một AI Project Manager cấp cao chuyên lập kế hoạch dự án Thiết Kế/Thi Công nội ngoại thất theo chuẩn SOP của JFLOW.
Nhiệm vụ của bạn là nhận thông tin đầu vào của dự án và sinh ra Lịch trình WBS (Work Breakdown Structure) JSON gồm 5 Nhiệm vụ Lớn (Phases) mang tính khuôn khổ, và số lượng Nhiệm vụ Con (Tasks) LINH ĐỘNG.

[THÔNG TIN DỰ ÁN TỪ NGƯỜI DÙNG]
- Tên dự án: ${projectName}
- Khách hàng: ${clientName}
- Vai trò: Lead = '${leadName}', Support = '${supportName}'
- Chi tiết: Loại hình: ${projectType}, Diện tích: ${area}m2, Phong cách: ${style}, Mức đầu tư: ${investment}

[HƯỚNG DẪN TẠO WBS ĐỘNG (DYNAMIC WBS)]
Bên dưới là CẤU TRÚC CƠ BẢN dành cho một dự án "Chung cư 100m2, 3 Phòng ngủ". 
Dựa vào Thông tin Dự án thực tế ở trên, BẠN PHẢI TỰ PHÂN TÍCH VÀ PHÁT TRIỂN khối lượng Task:
1. Nếu là "Nhà Phố", "Biệt Thự" -> BẮT BUỘC thêm các Task khảo sát địa chất, kết cấu, MEP, xin phép xây dựng (nếu xây mới), kiến trúc mặt tiền vào các giai đoạn tương ứng.
2. Nếu "Diện tích" lớn hơn -> Thêm thời gian (duration) vào các khâu dựng 3D, bổ kỹ thuật (Ví dụ bổ thêm các phòng). Nếu nhỏ hơn thì rút ngắn lại.
3. Nếu "Mức đầu tư" cao (Luxury) -> Thêm các bước kiểm duyệt vật liệu, làm mẫu (mockup), ánh sáng chuyên sâu.
Bạn không bị giới hạn ở 44 Tasks, có thể sinh ra 60, 80 hoặc rút gọn xuống 30 Tasks tùy quy mô, MIỄN LÀ ĐỦ CHI TIẾT.

[RÀNG BUỘC TỐI THƯỢNG]
1. Thuộc tính \`phaseId\` của mỗi Task Con phải khớp chính xác với \`id\` của Phase chứa nó.
2. OVERLAPPING: Các task vẽ kỹ thuật phải gối đầu song song với thời gian "Chờ KH phản hồi".

[CẤU TRÚC CƠ BẢN (CHUNG CƯ 100M2 - DÙNG ĐỂ THAM KHẢO VÀ MỞ RỘNG)]
* PHASE 1 (ID: GD1, Name: Giai đoạn 1: Concept & Chốt Layout)
1.1 Khảo sát, 1.2 Layout PA1, 1.3 Layout PA2, 1.4 Moodboard, 1.5 Gặp khách chốt...

* PHASE 2 (ID: GD2, Name: Giai đoạn 2: Dựng 3D & Render)
Dựng hình các phòng, Ánh sáng, Vật liệu, Hậu kỳ, Gửi khách...

* PHASE 3 (ID: GD3, Name: Giai đoạn 3: Chỉnh sửa & Gối đầu KT)
Chờ khách phản hồi (gối đầu với ->), MB Bố trí, MB Xây tường, MB Trần/Sàn/MEP...

* PHASE 4 (ID: GD4, Name: Giai đoạn 4: Bổ hồ sơ kỹ thuật)
Bổ đồ nội thất các phòng, Dim kích thước, Thống kê khối lượng...

* PHASE 5 (ID: GD5, Name: Giai đoạn 5: QC & Bàn giao)
Self-check, Leader check, Sửa lỗi, Bàn giao...

* PHASE 1 (ID: GD1, Name: Giai đoạn 1: Concept & Chốt Layout) => Kéo dài từ DAY 1 đến DAY 2
DAY 1: 1.1 (Khảo sát Tường), 1.2 (Khảo sát Trần/Dầm), 1.3 (Định vị ME), 1.4 (Chụp ảnh), 1.5 (Vẽ CAD hiện trạng), 1.6 (Layout PA1), 1.7 (Layout PA2)
DAY 2: 1.8 (Tìm Moodboard), 1.9 (Soạn trình bày), 1.10 (Gặp khách & Ký duyệt)

* PHASE 2 (ID: GD2, Name: Giai đoạn 2: Dựng 3D & Render) => Kéo dài từ DAY 3 đến DAY 7
DAY 3: 2.1 (Dựng khung bao), 2.2 (Model P.Khách)
DAY 4: 2.3 (Model Bếp)
DAY 5: 2.4 (Model Master), 2.5 (Model Ngủ Con), 2.6 (Khu phụ)
DAY 6: 2.7 (Decor), 2.8 (Ánh sáng), 2.9 (Vật liệu), 2.10 (Camera), 2.11 (Batch Render)
DAY 7: 2.12 (Hậu kỳ PTS), 2.13 (Gửi khách 3D Lần 1)

* PHASE 3 (ID: GD3, Name: Giai đoạn 3: Chỉnh sửa & Gối đầu KT) => Kéo dài từ DAY 8 đến DAY 12
DAY 8: 3.0 (Chờ KH phản hồi - Kéo dài 2 ngày), 3.1 (MB bố trí nội thất - Gối đầu)
DAY 9: 3.2 (MB Xây tường), 3.3 (MB Lát sàn), 3.4 (MB Trần đèn), 3.5 (MB Ổ cắm)
DAY 10: 3.6 (Trao đổi sửa đổi), 3.7 (Tổng hợp Word)
DAY 11: 3.8 (Sửa Model 3D), 3.9 (Gửi Final 3D)
DAY 12: 3.10 (Chờ KH chốt vật liệu - Kéo dài 1 ngày)

* PHASE 4 (ID: GD4, Name: Giai đoạn 4: Bổ hồ sơ kỹ thuật) => Kéo dài từ DAY 12 đến DAY 16 (Gối đầu với 3.10)
DAY 12: 4.1 (Bổ đồ gỗ P.Khách - Gối đầu với 3.10)
DAY 14: 4.2 (Bổ đồ Bếp), 4.3 (Bổ Ngủ), 4.4 (Bổ WC)
DAY 15: 4.5 (Dim kích thước)
DAY 16: 4.6 (Ghi chú quy cách), 4.7 (Trích xuất 3D), 4.8 (Thống kê khối lượng)

* PHASE 5 (ID: GD5, Name: Giai đoạn 5: QC & Bàn giao) => Kéo dài từ DAY 17 đến DAY 19
DAY 17: 5.1 (Tự check QC), 5.2 (Leader check), 5.3 (Sửa lỗi theo Leader)
DAY 18: 5.4 (Xuất hồ sơ in), 5.5 (Đóng gói Server)
DAY 19: 6.1 (Khởi động dự án tiếp theo)

[QUY TẮC TÍNH NGÀY (Start / End Date)]
- Start và End date của PHASE = Thời điểm bắt đầu sớm nhất và kết thúc muộn nhất của các task con bên trong nó.
- Tự động sắp xếp luồng công việc logic. Các task có thể nối tiếp nhau hoặc chạy song song.
- Dưới đây là mảng Calendar chứa danh sách các ngày làm việc (ĐÃ BỎ QUA T7, CN). BẠN BẮT BUỘC phải lấy giá trị "Ngày" từ mảng này theo Index để gán cho các task, không được tụng sinh ngày ở ngoài.
${JSON.stringify(workingDaysCalendar)}

[QUY TẮC GÁN NGƯỜI (ASSIGNEE)]
- Assignee: Các task Concept, Render, Gặp khách, Leader check -> Gán cho '${leadName}'. Các task MEP, CAD, Dựng hình thô, QC nội bộ -> Gán cho '${supportName}'. Các task Chờ phản hồi -> Gán cho '${clientName}'.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Tạo Lịch trình JSON WBS chi tiết cho dự án, dựa trên thông tin tôi nhập và hướng dẫn động (Dynamic WBS) của bạn:",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1,
            }
        });

        const generatedData = JSON.parse(response.text);

        return res.status(200).json(generatedData);

    } catch (err) {
        console.error("Gemini Generation Error:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error during AI generation' });
    }
}
