export interface TemplateTaskItem {
    name: string;
    target: 'construction';
    phase_name: string;
}

export const PRECONSTRUCTION_TEMPLATE_TASKS: TemplateTaskItem[] = [
    // Giai đoạn 1: Pháp lý & Hiện trạng
    { name: 'Khảo sát hiện trạng & kiểm tra pháp lý', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Soạn & nộp hồ sơ xin phép xây dựng / sửa chữa', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Theo dõi & nhận giấy phép xây dựng', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Lập timeline tổng công trình', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },

    // Giai đoạn 2: Kỹ thuật & Vật tư
    { name: 'Rà soát & chốt hồ sơ bản vẽ thi công', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Tư vấn & chốt mẫu vật tư, thiết bị với khách', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Lập bảng tổng hợp vật tư & thiết bị đã chốt', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },

    // Giai đoạn 3: Bóc tách & Báo giá
    { name: 'Bóc tách khối lượng thi công (QS)', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Lập BOQ báo giá thi công', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Trình & chốt báo giá thi công với CĐT', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Lấy & đàm phán báo giá từ Nhà cung cấp / Thầu phụ', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Chốt bảng giá vật tư final', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },

    // Giai đoạn 4: Hợp đồng & Chuẩn bị thi công
    { name: 'Soạn & ký hợp đồng với CĐT', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Soạn & ký hợp đồng thầu phụ / NCC', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Lập kế hoạch nhân lực thi công', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Lập tiến độ Gantt thi công chi tiết', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Điều phối vật tư & thiết bị đến công trình', target: 'construction', phase_name: 'Construction / Hồ sơ TC' },
    { name: 'Bàn giao mặt bằng & bắt đầu thi công', target: 'construction', phase_name: 'Construction / Hồ sơ TC' }
];
