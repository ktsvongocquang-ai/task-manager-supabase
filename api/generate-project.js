import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Helper: Generate a list of the next N working days (skipping weekends)
function getNextWorkingDays(startDateStr, numDays = 30) {
    const dates = [];
    let current = new Date(startDateStr);

    if (isNaN(current.getTime())) current = new Date();

    while (dates.length < numDays) {
        const dayOfWeek = current.getDay();
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
            bufferKh,
            note
        } = req.body;

        if (!projectName || !startDate) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const workingDaysCalendar = getNextWorkingDays(startDate, 40);

        const taskSchema = {
            type: SchemaType.OBJECT,
            properties: {
                code: { type: SchemaType.STRING, description: "Mã công việc (VD: 1.1, 1.2, 2.1)" },
                title: { type: SchemaType.STRING, description: "Tên công việc" },
                phaseId: { type: SchemaType.STRING, description: "ID của Giai đoạn (VD: concept, 3d, technic, deliver)" },
                start: { type: SchemaType.STRING, description: "Ngày bắt đầu (YYYY-MM-DD)" },
                end: { type: SchemaType.STRING, description: "Ngày kết thúc (YYYY-MM-DD)" },
                assignee: { type: SchemaType.STRING, description: "Người phụ trách (Tên Lead hoặc Support)" },
                duration: { type: SchemaType.INTEGER, description: "Thời lượng công việc tính bằng ngày" },
                note: { type: SchemaType.STRING, description: "Ghi chú thêm về task (mặc định rỗng)" }
            },
            required: ["code", "title", "phaseId", "start", "end", "assignee", "duration"]
        };

        const phaseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                id: { type: SchemaType.STRING, description: "ID của Giai đoạn (VD: GD1, GD2, GD3, GD4, GD5)" },
                name: { type: SchemaType.STRING, description: "Tên Giai đoạn (VD: Concept & Chốt Layout)" },
                start: { type: SchemaType.STRING, description: "Ngày bắt đầu Giai đoạn (YYYY-MM-DD)" },
                end: { type: SchemaType.STRING, description: "Ngày kết thúc Giai đoạn (YYYY-MM-DD)" }
            },
            required: ["id", "name", "start", "end"]
        };

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                phases: {
                    type: SchemaType.ARRAY,
                    description: "Danh sách 5 Giai đoạn chính (Phases/Parent Tasks)",
                    items: phaseSchema
                },
                tasks: {
                    type: SchemaType.ARRAY,
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

[HƯỚNG DẪN TẠO WBS ĐỘNG VÀ QUY TẮC THỜI GIAN]
1. TUÂN THỦ NGHIÊM NGẶT THỜI LƯỢNG: Tổng số ngày của các task con trong mỗi Phase KHÔNG ĐƯỢC VƯỢT QUÁ số ngày quy định:
* GD1: ~${phasesWd?.c || 3} ngày
* GD2: ~${phasesWd?.d3 || 7} ngày
* GD3: ~${bufferKh || 9} ngày (Buffer chờ KH)
* GD4: ~${(phasesWd?.s || 3) + (phasesWd?.kt || 4)} ngày
* GD5: ~${phasesWd?.qc || 2} ngày

2. GỐI ĐẦU VÀ OVERLAPPING:
   - Giai đoạn 4 có thể bắt đầu sớm khi đang ở Giai đoạn 3.
   - Xong 3D phải có ngay task Báo giá.

3. TỐI ƯU TỐC ĐỘ: KHÔNG sinh quá 25 Tasks. Gộp các việc nhỏ lẻ.

[CHỈ ĐẠO ĐẶC BIỆT TỪ BỘ PHẬN PHÂN TÍCH (NẾU CÓ)]
${note || 'Không có chỉ đạo thêm'}
(Chú ý: Nếu có phân bổ cụ thể của Concept, 3D, Tender, Construction, phải ép cứng số ngày của 5 Phases và Tasks tuân theo đúng chỉ đạo này, thay cho quy tắc mặt định)

[LỊCH LÀM VIỆC (Calendar - Bỏ qua T7, CN)]
${JSON.stringify(workingDaysCalendar)}
`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: systemInstruction
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Tạo Lịch trình JSON WBS chi tiết cho dự án" }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1,
            }
        });

        const generatedData = JSON.parse(result.response.text());
        return res.status(200).json(generatedData);

    } catch (err) {
        console.error("Gemini Generation Error:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
