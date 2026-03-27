import type { Project, CTask, Approval, Milestone, Subcontractor, Notification, AttendanceData, FinanceData, DailyLog, PaymentRecord, ConstructionPhase } from './types';

export const PROJECTS: Project[] = [
  { id: '1', name: 'Nhà cô Lan - Q.7', startDate: '2026-01-15', handoverDate: '2026-08-20', status: 'ĐANG THI CÔNG', progress: 45, budget: 2500000000, spent: 1200000000, contractValue: 2800000000, address: '123 Đường số 4, P. Tân Phong, Q7', ownerName: 'Cô Lan', engineerName: 'Nguyễn Văn Hùng', budgetSpent: 42, riskLevel: 'green', unexpectedCosts: 121777000, totalDocuments: 8, daysOff: 11, totalDiaryEntries: 177 },
  { id: '2', name: 'Biệt thự Anh Hùng - Thủ Đức', startDate: '2026-02-01', handoverDate: '2026-11-15', status: 'MỚI', progress: 28, budget: 5000000000, spent: 500000000, contractValue: 5500000000, address: '45 Khu đô thị Vạn Phúc, Thủ Đức', ownerName: 'Anh Hùng', engineerName: 'Trần Minh Tuấn', budgetSpent: 35, riskLevel: 'yellow', unexpectedCosts: 45000000, totalDocuments: 5, daysOff: 3, totalDiaryEntries: 42 },
  { id: '3', name: 'Nhà phố Tân Bình', startDate: '2026-03-01', handoverDate: '2026-09-30', status: 'MỚI', progress: 12, budget: 1900000000, spent: 190000000, contractValue: 1900000000, address: '78 Cộng Hòa, Q. Tân Bình', ownerName: 'Chị Hạnh', engineerName: 'Lê Quốc Bảo', budgetSpent: 10, riskLevel: 'green', unexpectedCosts: 0, totalDocuments: 3, daysOff: 1, totalDiaryEntries: 15 },
  { id: '4', name: 'Nhà phố Gò Vấp', startDate: '2025-11-01', handoverDate: '2026-05-15', status: 'ĐANG THI CÔNG', progress: 72, budget: 2400000000, spent: 1920000000, contractValue: 2400000000, address: '56 Quang Trung, Q. Gò Vấp', ownerName: 'Anh Tâm', engineerName: 'Phạm Đức', budgetSpent: 80, riskLevel: 'red', unexpectedCosts: 210000000, totalDocuments: 12, daysOff: 8, totalDiaryEntries: 98 },
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
  {
    id: 'm1', name: 'Nghiệm thu móng', status: 'passed', approvedDate: '2026-02-10', paymentAmount: 560000000, paymentStatus: 'paid',
    subTasks: [
      { id: 'st1', name: 'Làm lán trại thi công', status: 'done', progress: 100, photos: ['📷'] },
      { id: 'st2', name: 'Ép cọc bê tông', status: 'done', progress: 100, photos: ['📷', '📷', '📷'] },
      { id: 'st3', name: 'Đào đất hố móng', status: 'done', progress: 100, photos: ['📷', '📷'] },
      { id: 'st4', name: 'Đổ đá dăm lót', status: 'done', progress: 100, photos: ['📷'] },
      { id: 'st5', name: 'Đi sắt (cốt thép móng)', status: 'done', progress: 100, photos: ['📷', '📷', '📷', '📷'] },
      { id: 'st6', name: 'Ghép cốp pha móng', status: 'done', progress: 100, photos: ['📷', '📷'] },
      { id: 'st7', name: 'Đổ bê tông móng', status: 'done', progress: 100, photos: ['📷', '📷', '📷'] },
    ],
  },
  {
    id: 'm2', name: 'Nghiệm thu kết cấu trệt', status: 'passed', approvedDate: '2026-03-10', paymentAmount: 560000000, paymentStatus: 'paid',
    subTasks: [
      { id: 'st8', name: 'Xây tường bao trệt', status: 'done', progress: 100, photos: ['📷', '📷'] },
      { id: 'st9', name: 'Đi cốt thép cột + dầm', status: 'done', progress: 100, photos: ['📷', '📷', '📷'] },
      { id: 'st10', name: 'Đổ bê tông cột trệt', status: 'done', progress: 100, photos: ['📷'] },
      { id: 'st11', name: 'Ghép cốp pha sàn', status: 'done', progress: 100, photos: ['📷', '📷'] },
      { id: 'st12', name: 'Đổ bê tông sàn lầu 1', status: 'done', progress: 100, photos: ['📷', '📷', '📷'] },
    ],
  },
  {
    id: 'm3', name: 'Nghiệm thu kết cấu lầu 1', status: 'pending_internal', approvedDate: null, paymentAmount: 560000000, paymentStatus: 'unpaid',
    subTasks: [
      { id: 'st13', name: 'Xây tường bao lầu 1', status: 'done', progress: 100, photos: ['📷'] },
      { id: 'st14', name: 'Đi cốt thép cột lầu 1', status: 'doing', progress: 75, photos: ['📷', '📷'], note: 'Đang chờ thép nhập thêm' },
      { id: 'st15', name: 'Ghép cốp pha sàn lầu 2', status: 'upcoming', progress: 0, photos: [] },
      { id: 'st16', name: 'Đổ bê tông sàn lầu 2', status: 'upcoming', progress: 0, photos: [] },
    ],
  },
  {
    id: 'm4', name: 'Nghiệm thu kết cấu lầu 2', status: 'upcoming', approvedDate: null, paymentAmount: 560000000, paymentStatus: 'unpaid',
    subTasks: [
      { id: 'st17', name: 'Xây tường bao lầu 2', status: 'upcoming', progress: 0, photos: [] },
      { id: 'st18', name: 'Đi cốt thép mái', status: 'upcoming', progress: 0, photos: [] },
      { id: 'st19', name: 'Đổ bê tông mái + chống thấm', status: 'upcoming', progress: 0, photos: [] },
    ],
  },
  {
    id: 'm5', name: 'Nghiệm thu hoàn thiện + Bàn giao', status: 'upcoming', approvedDate: null, paymentAmount: 560000000, paymentStatus: 'unpaid',
    subTasks: [
      { id: 'st20', name: 'Tô trát trong/ngoài', status: 'upcoming', progress: 0, photos: [] },
      { id: 'st21', name: 'Lắp đặt MEP hoàn thiện', status: 'upcoming', progress: 0, photos: [] },
      { id: 'st22', name: 'Ốp lát nền + WC', status: 'upcoming', progress: 0, photos: [] },
      { id: 'st23', name: 'Sơn nước + Vệ sinh', status: 'upcoming', progress: 0, photos: [] },
      { id: 'st24', name: 'Bàn giao nhà', status: 'upcoming', progress: 0, photos: [] },
    ],
  },
];

export const SUBCONTRACTORS: Subcontractor[] = [
  { id: 's1', name: 'Cty Điện Minh Phát', trade: 'Điện', phone: '0909 123 456', rating: 4.5, projectIds: ['1', '2'], contractAmount: 280000000, paidAmount: 180000000, progressPercent: 65 },
  { id: 's2', name: 'Nước Toàn Thắng', trade: 'Cấp thoát nước', phone: '0912 345 678', rating: 4.2, projectIds: ['1', '3'], contractAmount: 150000000, paidAmount: 95000000, progressPercent: 60 },
  { id: 's3', name: 'Nhôm kính Đại Phát', trade: 'Nhôm kính', phone: '0938 567 890', rating: 4.0, projectIds: ['2', '4'], contractAmount: 320000000, paidAmount: 160000000, progressPercent: 50 },
  { id: 's4', name: 'Sơn Bảo Ngọc', trade: 'Sơn nước', phone: '0977 890 123', rating: 4.7, projectIds: ['1', '4'], contractAmount: 120000000, paidAmount: 48000000, progressPercent: 35 },
  { id: 's5', name: 'Công ty XD Nam', trade: 'Xây dựng chính', phone: '0901 234 567', rating: 4.8, projectIds: ['1', '2', '3', '4'], contractAmount: 1800000000, paidAmount: 1100000000, progressPercent: 72 },
  { id: 's6', name: 'Phòng cháy Sài Gòn', trade: 'PCCC', phone: '0918 765 432', rating: 4.1, projectIds: ['1', '4'], contractAmount: 95000000, paidAmount: 47500000, progressPercent: 50 },
  { id: 's7', name: 'Trắc đạc Việt', trade: 'Trắc đạc', phone: '0905 111 222', rating: 4.6, projectIds: ['1', '2', '3'], contractAmount: 35000000, paidAmount: 35000000, progressPercent: 100 },
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

// ═══════════════════════════════════════════════════════════
// DAILY LOGS — Nhật ký thi công hàng ngày
// ═══════════════════════════════════════════════════════════
export const DAILY_LOGS: DailyLog[] = [
  {
    id: 'dl1', date: '2026-03-28', projectId: '1', weatherAM: 'sunny', weatherPM: 'sunny',
    taskCategory: 'Xây tường bao trệt', taskProgress: 71,
    workerCount: { main: 5, helper: 3 },
    sitePhotos: ['site_1.jpg', 'site_2.jpg', 'site_3.jpg', 'site_4.jpg', 'site_5.jpg'],
    contractorPhotos: ['ctr_1.jpg', 'ctr_2.jpg', 'ctr_3.jpg'],
    videos: ['video_1.mp4'],
    voiceNotes: ['Hôm nay xây xong tường phía Đông, cần kiểm tra lại mạch vữa góc phòng khách'],
    notes: 'Tiến độ đúng kế hoạch. Cần nhập thêm gạch block cho tuần sau.',
    issues: ['i1'], createdBy: 'ENGINEER', editable: true,
    status: 'pending', reporterName: 'Nguyễn Văn Hùng', temperature: 34,
    machines: 'Máy trộn hồ mini, xe rùa', materials: 'Gạch tuynel 8x8x18 (2000 viên), Xi măng INSEE (15 bao)',
    comments: [],
  },
  {
    id: 'dl2', date: '2026-03-27', projectId: '1', weatherAM: 'sunny', weatherPM: 'rainy',
    taskCategory: 'Xây tường bao trệt', taskProgress: 65,
    workerCount: { main: 5, helper: 3 },
    sitePhotos: ['site_6.jpg', 'site_7.jpg', 'site_8.jpg'],
    contractorPhotos: ['ctr_4.jpg', 'ctr_5.jpg'],
    videos: [],
    voiceNotes: ['Chiều mưa, ngưng thi công từ 3h. Đã che bạt tường mới xây.'],
    notes: 'Mưa chiều, tạm ngưng. Vật tư đủ cho 2 ngày tiếp.',
    issues: [], createdBy: 'ENGINEER', editable: true,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 30,
    machines: 'Máy trộn hồ mini', materials: 'Cát xây, Đá mi bụi',
    comments: [{ id: 'cmt1', author: 'Quản lý', text: 'Nhớ trùm nilon kỹ để mai xây tiếp không bị ướt gạch', time: '16:45' }],
  },
  {
    id: 'dl3', date: '2026-03-26', projectId: '1', weatherAM: 'cloudy', weatherPM: 'sunny',
    taskCategory: 'Xây tường bao trệt', taskProgress: 55,
    workerCount: { main: 4, helper: 3 },
    sitePhotos: ['site_9.jpg', 'site_10.jpg'],
    contractorPhotos: ['ctr_6.jpg', 'ctr_7.jpg', 'ctr_8.jpg', 'ctr_9.jpg'],
    videos: ['video_2.mp4'],
    voiceNotes: [],
    notes: 'Thợ chính nghỉ 1 người. Tiến độ giảm nhẹ.',
    issues: [], createdBy: 'ENGINEER', editable: true,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 32,
    machines: 'Máy cắt gạch', materials: 'Gạch tuynel',
    comments: [],
  },
  {
    id: 'dl4', date: '2026-03-25', projectId: '1', weatherAM: 'rainy', weatherPM: 'rainy',
    taskCategory: 'Nghỉ do mưa', taskProgress: 50,
    workerCount: { main: 0, helper: 0 },
    sitePhotos: ['site_11.jpg'],
    contractorPhotos: [],
    videos: [],
    voiceNotes: ['Mưa cả ngày, công trường ngập nước. Đã bơm thoát nước.'],
    notes: 'Mưa lớn cả ngày, nghỉ thi công. Kiểm tra chống thấm tạm.',
    issues: [], createdBy: 'ENGINEER', editable: false,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 26,
    machines: 'Máy bơm chìm', materials: '',
    comments: [{ id: 'cmt2', author: 'Cô Lan (Chủ nhà)', text: 'Cố gắng bơm nước nhanh để mai làm lại nhé cháu', time: '10:15' }],
  },
  {
    id: 'dl5', date: '2026-03-24', projectId: '1', weatherAM: 'sunny', weatherPM: 'cloudy',
    taskCategory: 'Xây tường bao trệt', taskProgress: 50,
    workerCount: { main: 5, helper: 4 },
    sitePhotos: ['site_12.jpg', 'site_13.jpg', 'site_14.jpg', 'site_15.jpg', 'site_16.jpg', 'site_17.jpg'],
    contractorPhotos: ['ctr_10.jpg', 'ctr_11.jpg'],
    videos: ['video_3.mp4', 'video_4.mp4'],
    voiceNotes: ['Đã xong tường phía Tây tầng trệt, chất lượng tốt'],
    notes: 'Hoàn thành tường phía Tây. Bắt đầu tường phía Bắc ngày mai.',
    issues: [], createdBy: 'ENGINEER', editable: false,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 35,
    machines: '', materials: 'Xi măng, Cát',
    comments: [],
  },
  {
    id: 'dl6', date: '2026-03-23', projectId: '1', weatherAM: 'sunny', weatherPM: 'sunny',
    taskCategory: 'BTCT cột trệt', taskProgress: 100,
    workerCount: { main: 6, helper: 4 },
    sitePhotos: ['site_18.jpg', 'site_19.jpg', 'site_20.jpg'],
    contractorPhotos: ['ctr_12.jpg', 'ctr_13.jpg', 'ctr_14.jpg', 'ctr_15.jpg', 'ctr_16.jpg'],
    videos: ['video_5.mp4'],
    voiceNotes: [],
    notes: 'Đổ bê tông cột trệt xong 100%. Chờ 7 ngày dưỡng hộ.',
    issues: [], createdBy: 'ENGINEER', editable: false,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 36,
    machines: 'Xe rùa, Đầm dùi', materials: 'Bê tông tươi M250 (12 khối)',
    comments: [],
  },
  {
    id: 'dl7', date: '2026-03-22', projectId: '1', weatherAM: 'sunny', weatherPM: 'sunny',
    taskCategory: 'BTCT cột trệt', taskProgress: 85,
    workerCount: { main: 6, helper: 4 },
    sitePhotos: ['site_21.jpg', 'site_22.jpg'],
    contractorPhotos: ['ctr_17.jpg', 'ctr_18.jpg'],
    videos: [],
    voiceNotes: ['Cốt thép cột C3 bị cong, yêu cầu nắn lại trước khi ghép cốp pha'],
    notes: 'Ghép cốp pha cột xong 85%. Phát hiện cốt thép C3 cong.',
    issues: [], createdBy: 'ENGINEER', editable: false,
    status: 'rejected', reporterName: 'Nguyễn Văn Hùng', temperature: 35,
    machines: 'Đầm dùi', materials: 'Ván cốp pha phim, Xà gồ',
    comments: [{ id: 'cmt3', author: 'Quản lý', text: 'Chụp hình cột C3 gửi anh xem lại độ thẳng', time: '11:20' }],
  },
  {
    id: 'dl8', date: '2026-03-21', projectId: '1', weatherAM: 'rainy', weatherPM: 'cloudy',
    taskCategory: 'Chuẩn bị cốt thép cột', taskProgress: 70,
    workerCount: { main: 4, helper: 2 },
    sitePhotos: ['site_23.jpg'],
    contractorPhotos: ['ctr_19.jpg', 'ctr_20.jpg', 'ctr_21.jpg'],
    videos: [],
    voiceNotes: [],
    notes: 'Sáng mưa nhỏ, chiều tạnh. Tiếp tục gia công thép.',
    issues: [], createdBy: 'ENGINEER', editable: false,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 28,
    machines: 'Máy uốn sắt, Máy cắt sắt', materials: 'Phi 16 Pomina',
    comments: [],
  },
  {
    id: 'dl9', date: '2026-03-20', projectId: '1', weatherAM: 'sunny', weatherPM: 'sunny',
    taskCategory: 'Chuẩn bị cốt thép cột', taskProgress: 55,
    workerCount: { main: 5, helper: 3 },
    sitePhotos: ['site_24.jpg', 'site_25.jpg', 'site_26.jpg', 'site_27.jpg'],
    contractorPhotos: ['ctr_22.jpg'],
    videos: ['video_6.mp4'],
    voiceNotes: ['Nhập thép Pomina D16 về 2.5 tấn, kiểm tra mác thép đúng C300'],
    notes: 'Nhập thép mới. Bắt đầu gia công cốt thép cột tầng trệt.',
    issues: ['i1'], createdBy: 'ENGINEER', editable: false,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 34,
    machines: '', materials: 'Thép D16 (2.5 tấn), Thép D8 (300kg)',
    comments: [],
  },
  {
    id: 'dl10', date: '2026-03-19', projectId: '1', weatherAM: 'cloudy', weatherPM: 'rainy',
    taskCategory: 'Đào móng', taskProgress: 100,
    workerCount: { main: 5, helper: 4 },
    sitePhotos: ['site_28.jpg', 'site_29.jpg'],
    contractorPhotos: ['ctr_23.jpg', 'ctr_24.jpg', 'ctr_25.jpg'],
    videos: [],
    voiceNotes: [],
    notes: 'Hoàn thành đào móng. Chuẩn bị cho đổ đá dăm lót.',
    issues: [], createdBy: 'ENGINEER', editable: false,
    status: 'approved', reporterName: 'Nguyễn Văn Hùng', temperature: 31,
    machines: 'Máy cuốc 0.3', materials: '',
    comments: [],
  },
];

// ═══════════════════════════════════════════════════════════
// PAYMENT RECORDS — Lịch sử thanh toán
// ═══════════════════════════════════════════════════════════
export const PAYMENT_RECORDS: PaymentRecord[] = [
  { id: 'pr1', projectId: '1', date: '2026-01-18', description: 'Đặt cọc ép cọc', amount: 14710000, billPhotos: ['bill_1.jpg'], type: 'payment_out', status: 'confirmed', category: 'Nhân công' },
  { id: 'pr2', projectId: '1', date: '2026-01-18', description: 'Mua thép D10 + D12', amount: 19640000, billPhotos: ['bill_2.jpg'], type: 'payment_out', status: 'confirmed', category: 'Vật liệu' },
  { id: 'pr3', projectId: '1', date: '2026-01-18', description: 'Xi măng INSEE 50 bao', amount: 136000000, billPhotos: ['bill_3.jpg', 'bill_4.jpg'], type: 'payment_out', status: 'confirmed', category: 'Vật liệu' },
  { id: 'pr4', projectId: '1', date: '2026-01-18', description: 'Cát xây + đá 1x2', amount: 138600000, billPhotos: ['bill_5.jpg'], type: 'payment_out', status: 'confirmed', category: 'Vật liệu' },
  { id: 'pr5', projectId: '1', date: '2026-01-18', description: 'Phí giám sát T1', amount: 7000000, billPhotos: [], type: 'payment_out', status: 'confirmed', category: 'Quản lý' },
  { id: 'pr6', projectId: '1', date: '2026-01-18', description: 'Thuê xe cẩu + xe tải', amount: 189900000, billPhotos: ['bill_6.jpg', 'bill_7.jpg', 'bill_8.jpg'], type: 'payment_out', status: 'confirmed', category: 'Thiết bị' },
  { id: 'pr7', projectId: '1', date: '2026-01-18', description: 'Dọn dẹp mặt bằng', amount: 17000000, billPhotos: ['bill_9.jpg'], type: 'payment_out', status: 'confirmed', category: 'Nhân công' },
  { id: 'pr8', projectId: '1', date: '2026-02-04', description: 'TT đợt 1 — Khách hàng', amount: 560000000, billPhotos: ['bill_10.jpg', 'bill_11.jpg'], type: 'payment_in', status: 'confirmed', category: 'Thu' },
  { id: 'pr9', projectId: '1', date: '2026-02-14', description: 'Mua gạch block 10x20x40', amount: 44700000, billPhotos: ['bill_12.jpg'], type: 'payment_out', status: 'confirmed', category: 'Vật liệu' },
  { id: 'pr10', projectId: '1', date: '2026-02-14', description: 'Ống nước PPR Ø20-32', amount: 8500000, billPhotos: ['bill_13.jpg'], type: 'payment_out', status: 'confirmed', category: 'Vật liệu' },
  { id: 'pr11', projectId: '1', date: '2026-03-10', description: 'TT đợt 2 — Khách hàng', amount: 560000000, billPhotos: ['bill_14.jpg', 'bill_15.jpg'], type: 'payment_in', status: 'confirmed', category: 'Thu' },
  { id: 'pr12', projectId: '1', date: '2026-03-15', description: 'Tạm ứng nhân công T3', amount: 85000000, billPhotos: [], type: 'payment_out', status: 'pending', category: 'Nhân công' },
];

// ═══════════════════════════════════════════════════════════
// CONSTRUCTION PHASES — Hạng mục trước khi thi công
// ═══════════════════════════════════════════════════════════
export const CONSTRUCTION_PHASES: ConstructionPhase[] = [
  { id: 'cp1', name: 'Khởi công', status: 'done', order: 1, startDate: '2026-01-10', endDate: '2026-01-12', note: 'Lễ khởi công + triển khai mặt bằng' },
  { id: 'cp2', name: 'Đo ranh và xác định cốt nền', status: 'done', order: 2, startDate: '2026-01-12', endDate: '2026-01-13' },
  { id: 'cp3', name: 'Thiết kế bản vẽ kỹ thuật', status: 'done', order: 3, startDate: '2025-12-01', endDate: '2026-01-10', note: 'Bản vẽ kiến trúc + kết cấu + MEP' },
  { id: 'cp4', name: 'Tháo dỡ (nếu có)', status: 'done', order: 4, startDate: '2026-01-13', endDate: '2026-01-14' },
  { id: 'cp5', name: 'Ép cọc / Khoan nhồi', status: 'done', order: 5, startDate: '2026-01-15', endDate: '2026-01-20' },
  { id: 'cp6', name: 'Đào móng + Đà kiềng', status: 'done', order: 6, startDate: '2026-01-21', endDate: '2026-02-01' },
  { id: 'cp7', name: 'Kết cấu tầng trệt', status: 'doing', order: 7, startDate: '2026-02-02', note: 'Đang thi công' },
  { id: 'cp8', name: 'Kết cấu lầu 1', status: 'upcoming', order: 8 },
  { id: 'cp9', name: 'Kết cấu lầu 2 + mái', status: 'upcoming', order: 9 },
  { id: 'cp10', name: 'MEP (Điện nước)', status: 'upcoming', order: 10 },
  { id: 'cp11', name: 'Tô trát + hoàn thiện', status: 'upcoming', order: 11 },
  { id: 'cp12', name: 'Ốp lát + nội thất', status: 'upcoming', order: 12 },
  { id: 'cp13', name: 'Sơn + vệ sinh', status: 'upcoming', order: 13 },
  { id: 'cp14', name: 'Nghiệm thu + Bàn giao', status: 'upcoming', order: 14 },
];
