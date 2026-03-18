export const DEFAULT_PERMISSIONS = {
    'QUYỀN TRUY CẬP (XEM) & CHỈNH SỬA (SỬA) THEO TAB': [
        {
            name: 'Tab Công Việc (Xem)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Tab Công Việc (Sửa)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Tab Marketing (Xem)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Tab Marketing (Sửa)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Tab Thi Công (Xem)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Tab Thi Công (Sửa)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Tab Chăm Sóc KH (Xem)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Tab Chăm Sóc KH (Sửa)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: false, note: '' }
        },
    ],
    'QUẢN LÝ DỰ ÁN (CHUNG)': [
        {
            name: 'Tạo dự án mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: 'Chỉ tạo dự án phụ trách' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Xem tất cả dự án',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Sửa/xóa dự án',
            admin: { value: true, note: '' },
            manager: { value: true, note: 'Chỉ dự án của mình' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
    ],
    'QUẢN LÝ NHIỆM VỤ (CHUNG)': [
        {
            name: 'Tạo nhiệm vụ mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Giao việc cho người khác',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Xem tất cả nhiệm vụ',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Cập nhật tiến độ CV',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
        },
    ]
}

// Flat map default converter
export const generateFlatPermissions = () => {
    const flat: Record<string, any> = {};
    Object.entries(DEFAULT_PERMISSIONS).forEach(([_cat, rows]) => {
        rows.forEach(row => {
            flat[row.name] = {
                'Admin': row.admin.value,
                'Quản lý': row.manager.value,
                'Thiết Kế': row.design.value,
                'Marketing': row.marketing.value,
                'Sale': row.sale.value,
                'Giám Sát': row.supervisor.value,
            }
        })
    });
    return flat;
};
