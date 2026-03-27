import type { Project, CTask, Approval, Milestone, Subcontractor, Notification, AttendanceData, FinanceData } from './types';

export const PROJECTS: Project[] = [
  { id: '1', name: 'Nhà cô Lan - Q.7', startDate: '2026-01-15', handoverDate: '2026-08-20', status: 'ĐANG THI CÔNG', progress: 45, budget: 2500000000, spent: 1200000000, contractValue: 2800000000, address: '123 Đường số 4, P. Tân Phong, Q7', ownerName: 'Cô Lan', engineerName: 'Nguyễn Văn Hùng', budgetSpent: 42, riskLevel: 'green' },
  { id: '2', name: 'Biệt thự Anh Hùng - Thủ Đức', startDate: '2026-02-01', handoverDate: '2026-11-15', status: 'MỚI', progress: 28, budget: 5000000000, spent: 500000000, contractValue: 5500000000, address: '45 Khu đô thị Vạn Phúc, Thủ Đức', ownerName: 'Anh Hùng', engineerName: 'Trần Minh Tuấn', budgetSpent: 35, riskLevel: 'yellow' },
  { id: '3', name: 'Nhà phố Tân Bình', startDate: '2026-03-01', handoverDate: '2026-09-30', status: 'MỚI', progress: 12, budget: 1900000000, spent: 190000000, contractValue: 1900000000, address: '78 Cộng Hòa, Q. Tân Bình', ownerName: 'Chị Hạnh', engineerName: 'Lê Quốc Bảo', budgetSpent: 10, riskLevel: 'green' },
  { id: '4', name: 'Nhà phố Gò Vấp', startDate: '2025-11-01', handoverDate: '2026-05-15', status: 'ĐANG THI CÔNG', progress: 72, budget: 2400000000, spent: 1920000000, contractValue: 2400000000, address: '56 Quang Trung, Q. Gò Vấp', ownerName: 'Anh Tâm', engineerName: 'Phạm Đức', budgetSpent: 80, riskLevel: 'red' },
];

export const TASKS: CTask[] = [
  { id: 't1', name: 'Ép cọc bê tông cốt thép', category: 'PHẦN THÔ', status: 'DONE', subcontractor: 'Công ty Nền Móng Việt', days: 5, budget: 150000000, spent: 145000000, approved: true, dependencies: [], tags: ['#EpCoc'], issues: [], progress: 100, startDate: '2026-01-15', endDate: '2026-01-20', checklist: [{ id: 'c1', label: 'Kiểm tra tim cọc', completed: true, required: true }, { id: 'c2', label: 'Nghiệm thu vật liệu đầu vào', completed: true, required: true }, { id: 'c3', label: 'Ép cọc thử', completed: true, required: true }] },
  { id: 't2', name: 'Đào móng và thi công đà kiềng', category: 'PHẦN THÔ', status: 'DONE', subcontractor: 'Công ty XD Nam', days: 10, budget: 250000000, spent: 260000000, approved: true, dependencies: ['t1'], tags: ['#Mong'], issues: [], progress: 100, startDate: '2026-01-21', endDate: '2026-02-01', checklist: [{ id: 'c4', label: 'Đào đất đúng cao độ', completed: true, required: true }, { id: 'c5', label: 'Lắp đặt cốt thép móng', completed: true, required: true }] },
  { id: 't3', name: 'Xây tường bao tầng trệt', category: 'PHẦN THÔ', status: 'DOING', subcontractor: 'Công ty XD Nam', days: 7, budget: 120000000, spent: 50000000, approved: true, dependencies: ['t2'], tags: ['#XayTuong'], progress: 71, startDate: '2026-02-02', endDate: '2026-02-09', issues: [{ id: 'i1', title: 'Sai lệch kích thước cửa sổ', description: 'Cửa sổ phòng khách bị lệch 5cm so với bản vẽ', status: 'OPEN', severity: 'HIGH', createdAt: '2026-03-20' }], checklist: [{ id: 'c7', label: 'Kiểm tra mạch vữa đều', completed: true, required: true }, { id: 'c8', label: 'Kiểm tra thẳng đứng bằng máy', completed: false, required: true }] },
  { id: 't4', name: 'Lắp đặt hệ thống điện nước âm tường', category: 'MEP', status: 'TODO', subcontractor: 'Điện Nước Hoàng Gia', days: 8, budget: 180000000, spent: 0, approved: false, dependencies: ['t3'], tags: ['#MEP'], issues: [], progress: 0, startDate: '2026-02-10', endDate: '2026-02-18', checklist: [{ id: 'c10', label: 'Đục tường đúng sơ đồ', completed: false, required: true }, { id: 'c11', label: 'Lắp đặt ống điện', completed: false, required: true }] },
  { id: 't5', name: 'Đổ bê tông sàn tầng 2', category: 'PHẦN THÔ', status: 'TODO', subcontractor: 'Công ty XD Nam', days: 3, budget: 200000000, spent: 0, approved: false, dependencies: ['t3'], tags: ['#BeTong'], issues: [], progress: 0, startDate: '2026-02-19', endDate: '2026-02-22', checklist: [{ id: 'c12', label: 'Kiểm tra cốt thép trước đổ', completed: false, required: true }, { id: 'c13', label: 'Đổ bê tông đúng mác', completed: false, required: true }] },
  { id: 't6', name: 'Mái + Chống thấm', category: 'PHẦN THÔ', status: 'TODO', subcontractor: 'Công ty XD Nam', days: 7, budget: 210000000, spent: 0, approved: false, dependencies: ['t5'], tags: [], issues: [], progress: 0, startDate: '2026-02-23', endDate: '2026-03-02', checklist: [] },
  { id: 't7', name: 'Tô trát + Hoàn thiện', category: 'HOÀN THIỆN', status: 'TODO', subcontractor: 'Công ty XD Nam', days: 14, budget: 420000000, spent: 0, approved: false, dependencies: ['t6'], tags: [], issues: [], progress: 0, startDate: '2026-03-03', endDate: '2026-03-17', checklist: [] },
  { id: 't8', name: 'Sơn + Vệ sinh + Bàn giao', category: 'HOÀN THIỆN', status: 'TODO', subcontractor: 'Sơn Bảo Ngọc', days: 10, budget: 140000000, spent: 0, approved: false, dependencies: ['t7'], tags: [], issues: [], progress: 0, startDate: '2026-03-18', endDate: '2026-03-28', checklist: [] },
];

export const APPROVALS: Approval[] = [
  { id: 'a1', projectId: '1', type: 'qc', title: 'QC: Cốt thép sàn lầu 1', detail: '12 mục kiểm tra, 11 pass, 1 chờ xác nhận khoảng cách thép đai vị trí D3.', date: '2026-03-27', status: 'pending' },
  { id: 'a2', projectId: '2', type: 'material', title: 'Đề xuất vật tư: Thép Pomina D16', detail: 'Số lượng: 2.5 tấn. Ngân sách hạng mục còn lại: 85%.', date: '2026-03-27', status: 'pending' },
  { id: 'a3', projectId: '4', type: 'variation', title: 'Phát sinh: KH đổi gạch ốp WC', detail: 'Chênh lệch: +18,500,000 VND. Thời gian: +3 ngày.', date: '2026-03-26', status: 'pending' },
  { id: 'a4', projectId: '4', type: 'budget_alert', title: 'Cảnh báo: Vượt ngân sách phần thô', detail: 'Hạng mục kết cấu đã chi 80% nhưng mới hoàn thành 65%. Dự báo vượt 12%.', date: '2026-03-27', status: 'pending' },
];

export const MILESTONES: Milestone[] = [
  { id: 'm1', name: 'Nghiệm thu móng', status: 'passed', approvedDate: '2026-02-10', paymentAmount: 560000000, paymentStatus: 'paid' },
  { id: 'm2', name: 'Nghiệm thu kết cấu trệt', status: 'passed', approvedDate: '2026-03-10', paymentAmount: 560000000, paymentStatus: 'paid' },
  { id: 'm3', name: 'Nghiệm thu kết cấu lầu 1', status: 'pending_internal', approvedDate: null, paymentAmount: 560000000, paymentStatus: 'unpaid' },
  { id: 'm4', name: 'Nghiệm thu kết cấu lầu 2', status: 'upcoming', approvedDate: null, paymentAmount: 560000000, paymentStatus: 'unpaid' },
  { id: 'm5', name: 'Nghiệm thu hoàn thiện + Bàn giao', status: 'upcoming', approvedDate: null, paymentAmount: 560000000, paymentStatus: 'unpaid' },
];

export const SUBCONTRACTORS: Subcontractor[] = [
  { id: 's1', name: 'Cty Điện Minh Phát', trade: 'Điện', phone: '0909 123 456', rating: 4.5, projectIds: ['1', '2'] },
  { id: 's2', name: 'Nước Toàn Thắng', trade: 'Cấp thoát nước', phone: '0912 345 678', rating: 4.2, projectIds: ['1', '3'] },
  { id: 's3', name: 'Nhôm kính Đại Phát', trade: 'Nhôm kính', phone: '0938 567 890', rating: 4.0, projectIds: ['2', '4'] },
  { id: 's4', name: 'Sơn Bảo Ngọc', trade: 'Sơn nước', phone: '0977 890 123', rating: 4.7, projectIds: ['1', '4'] },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', level: 'critical', msg: 'Gò Vấp: Vượt ngân sách phần thô 12%', time: '10 phút trước', read: false },
  { id: 'n2', level: 'action', msg: 'Q.7: QC cốt thép sàn L1 chờ duyệt', time: '30 phút trước', read: false },
  { id: 'n3', level: 'action', msg: 'Thủ Đức: Đề xuất thép Pomina 2.5T chờ duyệt', time: '1 giờ trước', read: false },
  { id: 'n4', level: 'good', msg: 'Tân Bình: Hoàn thành đúng tiến độ tuần 4', time: '3 giờ trước', read: true },
  { id: 'n5', level: 'info', msg: 'Q.7: Nhật ký hôm nay đã cập nhật', time: '4 giờ trước', read: true },
];

export const FINANCE: FinanceData = {
  monthlyInflow: 3360000000, monthlyOutflow: 2890000000, workingCapital: 1240000000,
  upcoming: [
    { desc: 'KH Cô Lan — Đợt 3', amount: 560000000, dueDate: '05/04/2026', type: 'in' },
    { desc: 'TP Điện Minh Phát', amount: 125000000, dueDate: '01/04/2026', type: 'out' },
    { desc: 'NCC Thép Đại Thiên Lộc', amount: 340000000, dueDate: '03/04/2026', type: 'out' },
    { desc: 'KH Gò Vấp — Đợt 4', amount: 480000000, dueDate: '10/04/2026', type: 'in' },
  ],
};

export const ATTENDANCE: Record<string, AttendanceData> = {
  '1': { thisWeek: { main: 28, helper: 16 }, thisMonth: { main: 112, helper: 64 }, dailyRate: { main: 450000, helper: 280000 } },
  '2': { thisWeek: { main: 18, helper: 10 }, thisMonth: { main: 72, helper: 40 }, dailyRate: { main: 450000, helper: 280000 } },
};
