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

        // JFLOW V2.0 Formula: Calculate area scale multiplier (Base 100m2 = 1.0 multiplier).
        const areaNum = parseFloat(area) || 100;
        let scaleRatio = 1.0;
        if (areaNum <= 60) {
            scaleRatio = 0.75;
        } else if (areaNum <= 100) {
            scaleRatio = 0.75 + ((areaNum - 60) / 40.0) * (1.0 - 0.75);
        } else if (areaNum <= 140) {
            scaleRatio = 1.0 + ((areaNum - 100) / 40.0) * (1.5 - 1.0);
        } else if (areaNum <= 180) {
            scaleRatio = 1.5 + ((areaNum - 140) / 40.0) * (2.0 - 1.5);
        } else {
            scaleRatio = 2.0;
        }

        const systemInstruction = `
Bạn là một AI Timeline Engine (JFLOW v2.0), chuyên khởi tạo Workflow Kiến trúc dựa trên thuật toán nội suy.
Trọng trách của bạn là xuất ra JSON mảng tasks gồm ĐÚNG 38 TASK TỪ 1.1 ĐẾN 5.5, không được thêm hoặc bớt bất kỳ task nào.

[THÔNG TIN DỰ ÁN]
- Tên DA: ${projectName}
- Khách hàng: ${clientName}
- Vai trò: Lead = '${leadName}', Support = '${supportName}'
- Cấu hình: ${projectType} | ${style} | ${investment} | ${area}m2

[JFLOW V2.0 - BẢNG TASK & WD TIÊU CHUẨN 100m2]
Giai đoạn 1: Concept & Chốt Layout
1.1 Khảo sát: Đo thông thủy, trần, dầm, cột | Designer | 0.25 WD
1.2 Khảo sát: Định vị hộp KT, cấp thoát nước | Designer | 0.125 WD
1.3 Chụp ảnh hiện trạng (toàn cảnh + góc khó) | Designer | 0.125 WD
1.4 Vẽ lại hiện trạng CAD (clean layer rác) | Designer | 0.25 WD
1.5 Lên Layout 2D: PA1 (Công năng tối ưu) | Designer | 0.5 WD
1.6 Lên Layout 2D: PA2 (Sáng tạo/Phá cách) | Designer | 0.5 WD
1.7 Tìm Moodboard: Style, Tone màu, Vật liệu | Designer | 0.5 WD
1.8 Soạn file trình bày (PPT/PDF) | Designer | 0.5 WD
1.9 REVIEW NỘI BỘ: Leader duyệt Concept (Gate) | Leader | 0.25 WD
1.10 GẶP KHÁCH & KÝ DUYỆT LAYOUT (Client) | Leader + DS | 0.5 WD

Giai đoạn 2: Dựng 3D & Render
2.1 Dựng khung bao: Tường, Trần, Sàn, Cửa | Designer | 0.5 WD
2.2 Model P.Khách: Vách TV, Sofa, Bàn trà | Designer | 0.5 WD
2.3 Model Bếp: Tủ bếp trên/dưới, Đảo bếp | Designer | 0.5 WD
2.4 Model P.Ngủ Master: Giường, Tủ áo, Bàn phấn | Designer | 1 WD
2.5 Model P.Ngủ Con: Giường, Bàn học | Designer | 0.5 WD
2.6 Model Khu phụ: Tủ giày, Lavabo | Designer | 0.5 WD
2.7 Decor chi tiết: Rèm, Thảm, Tranh, Đèn | Designer | 0.5 WD
2.8 Setup ánh sáng (Sunlight, HDRI, IES) | Designer | 0.25 WD
2.9 Ốp vật liệu (Map gỗ, đá, vải, kính) | Designer | 0.25 WD
2.10 Đặt góc Camera | Designer | 0.125 WD
2.11 BATCH RENDER | Designer | 0.125 WD
2.12 Photoshop: Cân sáng, màu | Designer | 0.25 WD
2.13 REVIEW NỘI BỘ: Leader duyệt 3D (Gate) | Leader | 0.25 WD
2.14 GỬI KHÁCH HÀNG 3D (Lần 1) (Client) | Leader | 0.5 WD

Giai đoạn 3: Chỉnh sửa & Gối đầu KT
3.0 [WAITING] CHỜ KHÁCH XEM & PHẢN HỒI | Khách | 2.0 WD
3.1 VẼ KT: MB Bố trí nội thất | Designer | 0.5 WD
3.2 VẼ KT: MB Xây tường / Phá dỡ | Designer | 0.25 WD
3.3 VẼ KT: MB Lát sàn | Designer | 0.25 WD
3.4 VẼ KT: MB Trần đèn | Designer | 0.25 WD
3.5 VẼ KT: MB Ổ cắm / Công tắc | Designer | 0.25 WD
3.6 TRAO ĐỔI: Chốt PA sửa đổi (Call/Meeting) | Leader + DS | 0.25 WD
3.7 Tổng hợp feedback ra file Word | Designer | 0.125 WD
3.8 Sửa Model 3D & Re-render | Designer | 1 WD
3.9 Gửi khách chốt Final 3D | Leader | 0.25 WD
3.10 [WAITING] CHỜ KHÁCH CHỐT MÃ VẬT LIỆU/MÀU | Khách | 1.0 WD

Giai đoạn 4: Bổ hồ sơ kỹ thuật
4.1 Bổ đồ gỗ P.Khách | Designer | 1 WD
4.2 Bổ đồ gỗ Bếp | Designer | 1 WD
4.3 Bổ đồ gỗ P.Ngủ | Designer | 0.5 WD
4.4 Bổ đồ gỗ WC/Khác | Designer | 0.5 WD
4.5 Dim kích thước chi tiết | Designer | 0.5 WD
4.6 Ghi chú quy cách | Designer | 0.25 WD
4.7 Trích xuất 3D vào bản vẽ 2D | Designer | 0.25 WD
4.8 Thống kê khối lượng | Designer | 0.25 WD

Giai đoạn 5: QC & Bàn giao
5.1 TỰ CHECK LỖI (Super-QC) | Designer | 0.5 WD
5.2 LEADER CHECK: Gửi PDF cho quản lý | Leader | 0.25 WD
5.3 Sửa lỗi theo comment Leader | Designer | 0.5 WD
5.4 Xuất hồ sơ in ấn | Designer | 0.25 WD
5.5 Đóng gói thư mục Project | Designer | 0.25 WD

[THUẬT TOÁN XẾP LỊCH THEO DIỆN TÍCH (${area}m2)]
1. Hệ số Scale diện tích của dự án này đang là: x${scaleRatio.toFixed(3)}.
2. NHIỆM VỤ ĐẦU TIÊN: Nhân tất cả WD trong bảng mẫu cho Hệ số ${scaleRatio.toFixed(3)}, sau đó LÀM TRÒN THIÊN LÊN 0.25 gần nhất. (Riêng Task Wait Buffer giữ nguyên).
3. ĐIỀN CHÍNH XÁC assignee: 'Designer' phải điền tên '${supportName}'. 'Leader' điền tên '${leadName}'. 'Khách' điền tên '${clientName}'. Nếu là 'Leader + DS', điền tên '${leadName}, ${supportName}'.
4. TÍNH TOÁN NGÀY LỊCH (startDate, endDate):
- 1 WD tương đương 1 Ngày lịch hợp lệ trong Mảng sau đây:
${JSON.stringify(workingDaysCalendar)}
- Tuyệt đối không tự bịa ra ngày khác.
- Rất nhiều task có WD < 1 (vd: 0.25 WD, 0.5 WD). BẠN PHẢI GỘP CHÚNG VÀO CÙNG 1 NGÀY LỊCH (cộng dồn cho tới khi cán mốc 1 WD thì mới nhảy sang ngày tiếp theo trong mảng Calendar).
- Ví dụ: 1.1 (0.25WD), 1.2 (0.125WD), 1.3 (0.125WD), 1.4 (0.25WD) tổng cộng 0.75WD -> TẤT CẢ PHẢI CÓ CHUNG startDate và endDate là 1 ngày đầu tiên (index 0). Sang task 1.5, vì nó cần thêm 0.5WD nên sẽ vắt sang index 1.
Chỉ trả về chuỗi JSON Array. Đảm bảo ĐỦ TOÀN BỘ 38 TASKS kể trên.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Tiến hành mô phỏng Timeline và xuất JSON:",
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
