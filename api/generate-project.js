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
            area,
            phasesWd,
            bufferKh
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

[HƯỚNG DẪN TẠO WBS ĐỘNG (DYNAMIC WBS) VÀ QUY TẮC THỜI GIAN BẮT BUỘC]
Bên dưới là CẤU TRÚC CƠ BẢN dành cho một dự án. 
Dựa vào Thông tin Dự án thực tế ở trên, BẠN PHẢI TỰ PHÂN TÍCH VÀ PHÁT TRIỂN khối lượng Task, ĐỒNG THỜI TUÂN THỦ TUYỆT ĐỐI CÁC LUẬT VỀ THỜI GIAN SAU:

1. THỜI GIAN CONCEPT (PHASE 1): Task lập "Moodboard" (Concept/Vật liệu) LUÔN CỐ ĐỊNH LÀ 3 NGÀY, không quan tâm loại hình gì.
2. THỜI GIAN 3D (PHASE 2): Dựng 3D lần 1 phải mất từ 7 đến 10 ngày (tùy diện tích lớn nhỏ).
3. THỜI GIAN CHỈNH SỬA Khách hàng (PHASE 3): 
   - Quá trình Khách phản hồi và Sửa 3D lần 2, lần 3 sẽ diễn ra. MỖI LẦN sửa 3D cộng thêm 4-5 ngày. 
   - Tổng thời gian 3D (Phase 2 + Phase 3) kéo dài từ 7 đến 15 ngày.
4. THỜI GIAN TRIỂN KHAI BẢN VẼ (PHASE 4):
   - Chung cư: Kéo dài 5-7 ngày.
   - Nhà Phố / Biệt thự / Nhà ở: Kéo dài 10-15 ngày.
   - NẾU phong cách là "Tân cổ điển" (Neo-classic): CỘNG THÊM 5 ngày cho chung cư, CỘNG THÊM 10 ngày cho nhà phố vào tổng thời gian Triển khai bản vẽ.
5. GỐI ĐẦU VÀ OVERLAPPING QUAN TRỌNG:
   - TRONG KHI khách hàng đang Sửa 3D lần 2-3 (đang ở Phase 3), BẮT BUỘC phải bắt đầu tiến hành triển khai mặt bằng (MB Bố trí, MB Xây tường, MEP...). Do đó ngày Start của các task đầu tiên trong Phase 4 phải lồng ghép (overlap) bắt đầu cùng lúc với các task Sửa 3D ở Phase 3.
   - NGAY KHI VỪA XONG 3D (Task chốt 3D cuối cùng kết thúc), phải ngay lập tức có task "Bóc khối lượng & Báo giá".

[RÀNG BUỘC CÁC LOẠI HÌNH]
- Nếu là "Nhà Phố", "Biệt Thự" -> Thêm các Task: khảo sát địa chất, kết cấu, MEP, xin phép xây dựng, kiến trúc mặt tiền.
- Nếu là "Thương mại - Dịch vụ (Shop/F&B)" -> Thêm các Task: nhận diện thương hiệu (Branding) vào Concept, chi tiết quầy kệ, MEP công nghiệp vào Shop Drawing.
- Nếu là "Văn phòng" -> Thêm Task: Layout chỗ ngồi, vẽ hệ thống IT/M&E, pantry.
Bạn không bị giới hạn ở 44 Tasks, có thể sinh ra 40-70 Tasks tùy quy mô, MIỄN LÀ ĐỦ CHI TIẾT.

[RÀNG BUỘC PHASES VÀ THỜI LƯỢNG MỤC TIÊU]
Thuộc tính \`phaseId\` của mỗi Task Con phải khớp chính xác với \`id\` của Phase chứa nó. Phân bổ timeline của các Tasks sao cho khớp với TỔNG THỜI LƯỢNG lý thuyết sau (Đã được thuật toán nội suy dựa trên diện tích và phong cách):

* PHASE 1 (ID: GD1, Name: Giai đoạn 1: Concept & Chốt Layout) => THỜI LƯỢNG: ~${phasesWd?.c || 3} ngày
1.1 Khảo sát, 1.2 Layout PA1, 1.3 Layout PA2, 1.4 Moodboard (Fix 3 ngày), 1.5 Gặp khách chốt...

* PHASE 2 (ID: GD2, Name: Giai đoạn 2: Dựng 3D & Render) => THỜI LƯỢNG: ~${phasesWd?.d3 || 7} ngày 
Dựng hình các phòng, Ánh sáng, Vật liệu, Hậu kỳ, Gửi khách...

* PHASE 3 (ID: GD3, Name: Giai đoạn 3: Chỉnh sửa & Gối đầu KT) => THỜI LƯỢNG BUFFER: ~${bufferKh || 9} ngày
Chờ KH phản hồi, Sửa 3D lần 2, Sửa 3D lần 3... (LƯU Ý: Gối đầu gọi Phase 4 triển khai lúc này)

* PHASE 4 (ID: GD4, Name: Giai đoạn 4: Bổ hồ sơ kỹ thuật) => THỜI LƯỢNG: S(~${phasesWd?.s || 3} ngày) + KT(~${phasesWd?.kt || 4} ngày)
Triển khai MB Xây tường/Điện nước (bắt đầu sớm gối đầu Phase 3), Bổ chi tiết đồ nội thất, Bóc khối lượng & Báo giá (Ngay sau khi chốt 3D)...

* PHASE 5 (ID: GD5, Name: Giai đoạn 5: QC & Bàn giao) => THỜI LƯỢNG: ~${phasesWd?.qc || 2} ngày
Self-check, Leader check, Sửa lỗi, Bàn giao...

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
