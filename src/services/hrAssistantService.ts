import { supabase } from './supabase';

const ROLE_PRICES: Record<string, number> = {
    'Giám Sát': 4000,
    'Triển khai 2D': 4000,
    'Kỹ thuật MEP': 4000,
    'Chủ trì thiết kế': 8000,
    'Concept': 8000,
    'Thiết kế 3D Nội thất': 12000,
    'Kiến trúc sư chính': 15000,
    'Nhân viên': 4000, // fallback
    'Quản lý thiết kế': 15000,
};

const PROJECT_TYPE_MULTIPLIERS: Record<string, number> = {
    'Căn hộ': 1.0,
    'Nhà phố tiêu chuẩn': 1.0,
    'Biệt thự': 1.5,
    'Nhà phố cao cấp': 1.5,
    'Thương mại': 2.0,
    'Văn phòng': 2.0,
    'Resort': 2.0,
    'Đặc biệt': 2.5,
};

export const fetchHRDataAndCalculate = async (userId: string, role: string) => {
    // 1. Fetch user tasks for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startDateStr = startOfMonth.toISOString().split('T')[0];

    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
            id, name, status, priority, due_date, completion_date, project_id,
            projects ( name, project_type )
        `)
        .eq('assignee_id', userId)
        .gte('created_at', startDateStr);

    let totalM2 = 0;
    let actualSalary = 0;
    let delayedTaskCount = 0;

    const basePrice = ROLE_PRICES[role] || 4000;
    
    // Evaluate tasks
    const evaluatedTasks = (tasks || []).map((t: any) => {
        // Parse m2 from task name or description (e.g., "[50m2]")
        const m2Match = t.name.match(/(\d+)\s*m2/i);
        let m2 = m2Match ? parseInt(m2Match[1], 10) : 0;
        
        let typeMulti = 1.0;
        const pt = t.projects?.project_type || '';
        for (const key in PROJECT_TYPE_MULTIPLIERS) {
            if (pt.includes(key) || t.projects?.name.includes(key)) {
                typeMulti = PROJECT_TYPE_MULTIPLIERS[key];
                break;
            }
        }

        const isHardDeadline = t.name.includes('[DEADLINE CỨNG]') || t.priority === 'Khẩn cấp';
        let onTimeMulti = 1.0;
        let daysLate = 0;

        if (t.due_date) {
            const dueDate = new Date(t.due_date);
            const finishDate = t.completion_date ? new Date(t.completion_date) : new Date();
            
            const diffTime = finishDate.getTime() - dueDate.getTime();
            daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            if (isHardDeadline) {
                if (daysLate === 1) onTimeMulti = 0.85;
                else if (daysLate === 2) onTimeMulti = 0.70;
                else if (daysLate >= 3 || (!t.completion_date && new Date() > dueDate)) onTimeMulti = 0.50;
            }
        }

        if (daysLate > 0) delayedTaskCount++;

        const taskValue = m2 * typeMulti * basePrice * onTimeMulti;
        totalM2 += (m2 * typeMulti);
        actualSalary += taskValue;

        return {
            id: t.id,
            due_date: t.due_date,
            project_id: t.project_id,
            name: t.name,
            project: t.projects?.name || 'Khác',
            m2,
            typeMulti,
            onTimeMulti,
            daysLate,
            isHardDeadline,
            taskValue,
            status: t.status
        };
    });

    const kpiPercent = (totalM2 / 150) * 100;
    let finalSalary = actualSalary;
    let kpiMulti = 1.0;
    if (kpiPercent < 90) {
        kpiMulti = 0.9;
        finalSalary *= 0.9;
    } else if (kpiPercent > 100) {
        kpiMulti = 1.1;
        finalSalary *= 1.1;
    }

    return {
        evaluatedTasks,
        totalM2,
        actualSalary,
        kpiPercent,
        kpiMulti,
        finalSalary,
        delayedTaskCount
    };
};

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export const processHRQuestion = async (
    question: string,
    history: ChatMessage[],
    userId: string,
    userName: string,
    userRole: string
): Promise<string> => {
    try {
        const salaryData = await fetchHRDataAndCalculate(userId, userRole);
        
        const contextData = `
        DỮ LIỆU HIỆN TẠI (NHÂN SỰ: ${userName} - VAI TRÒ: ${userRole}):
        - Lương hiệu quả tháng này ước tính: ${salaryData.finalSalary.toLocaleString('vi-VN')} VNĐ
        - Nhịp KPI tháng: ${salaryData.kpiPercent.toFixed(1)}% (Mục tiêu 150m2 quy đổi - Đã làm được ${salaryData.totalM2.toFixed(1)}m2)
        - Hệ số KPI đang áp dụng: ${salaryData.kpiMulti}x
        - Số task quá hạn: ${salaryData.delayedTaskCount}
        
        DANH SÁCH TASK TRONG THÁNG (Max 10):
        ${salaryData.evaluatedTasks.slice(0, 10).map(t => `- [${t.status}] ${t.name} (Chậm: ${t.daysLate} ngày, ${t.isHardDeadline ? 'CỨNG' : 'MỀM'}, Quy đổi: ${(t.taskValue).toLocaleString('vi-VN')}đ)`).join('\n')}
        `;

        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
        if (!API_KEY) {
            return `Hệ thống chưa kết nối AI. Số liệu cơ bản của bạn:\nLương ước tính: ${salaryData.finalSalary.toLocaleString('vi-VN')} VNĐ (KPI: ${salaryData.kpiPercent.toFixed(1)}%).`;
        }

        const systemPrompt = `BẠN LÀ TRỢ LÝ QUẢN LÝ NHÂN SỰ (HR ASSISTANT) THÔNG MINH CHO NHÂN VIÊN.
        
        # VAI TRÒ CHÍNH:
        Bạn giải đáp theo thời gian thực về tiến độ task, tính KPI, lương năng suất của chính nhân sự đang hỏi.

        # QUY TẮC CẦN TUÂN THỦ NGHIÊM NGẶT:
        1. LUÔN HIỂN THỊ SỐ TIỀN CỤ THỂ HOẶC SỐ M2 KHI ĐƯỢC HỎI - KHÔNG DÙNG % TRỪU TƯỢNG, TRƯỜNG HỢP KHÔNG CÓ DATA THÌ BÁO 0Đ.
        2. TONE GIỌNG: CHUYÊN NGHIỆP, TRUNG LẬP - KHÔNG PHÁN XÉT.
        3. Nếu nhân sự hỏi "Lương tháng này của tôi là bao nhiêu?", hãy nói rõ tiền lương năng suất ước tính, % KPI và chỉ ra các task đang làm giảm hoặc tăng lương.
        4. Cảnh báo nếu nhân sự có task trễ gây giảm tiền.
        5. KHÔNG chia sẻ dữ liệu của người khác. Dữ liệu đã được cung cấp sẵn ở bên dưới là của riêng nhân sự.
        6. Đề xuất 1 HÀNH ĐỘNG RÕ RÀNG để nhân sự có thể làm (vd: "Hãy hoàn thành task X để đạt KPI...").
        `;

        const recentHistory = history.slice(-6).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const body = {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
                ...recentHistory,
                {
                    role: 'user',
                    parts: [{ text: `DỮ LIỆU CÁ NHÂN:\n${contextData}\n\nHỎI: ${question}` }]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000,
            }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) throw new Error('API Error');
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi.';
    } catch (e: any) {
        return 'Lỗi khi xử lý: ' + e.message;
    }
};
