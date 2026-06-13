import React from 'react';
import {
  X,
  User,
  Shield,
  Briefcase,
  Building2,
  Star,
  Award,
  CheckCircle2,
  BookOpen,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { UserRoleProfile, Project, MarkerNote } from '../types';

interface ProfileViewProps {
  activeUserRole: UserRoleProfile;
  userRolesList: UserRoleProfile[];
  projects: Project[];
  markerNotes: MarkerNote[];
  onSetActiveUserRole: (role: UserRoleProfile) => void;
  onClose: () => void;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'Tạo/xóa dự án',
    'Quản lý người dùng',
    'Duyệt bản vẽ',
    'Xem tất cả dự án',
    'Xuất báo cáo',
  ],
  'giám sát': [
    'Tạo lỗi mới',
    'Chụp ảnh hiện trường',
    'Ghi chú voice',
    'Cập nhật trạng thái lỗi',
    'Xem dự án được giao',
  ],
  'quản lý tc': [
    'Duyệt sửa lỗi',
    'Xem tiến độ',
    'Giao việc cho thợ',
    'Nghiệm thu công trình',
  ],
};

const ROLE_JOB_DESCRIPTIONS: Record<string, { paragraphs: string[]; kpis: string[] }> = {
  admin: {
    paragraphs: [
      'Quản trị viên chịu trách nhiệm tổng thể về hệ thống quản lý công trình, bao gồm việc thiết lập dự án, phân quyền người dùng và giám sát toàn bộ quy trình vận hành. Đảm bảo mọi thông tin được cập nhật chính xác và kịp thời.',
      'Phối hợp với các bộ phận để đảm bảo tiến độ dự án, xử lý các vấn đề phát sinh và báo cáo trực tiếp cho Ban Giám đốc. Quản lý tài liệu, bản vẽ và hồ sơ công trình theo tiêu chuẩn ISO.',
      'Đánh giá hiệu suất làm việc của các thành viên trong đội ngũ, đề xuất cải tiến quy trình và đào tạo nhân sự mới về hệ thống quản lý.',
    ],
    kpis: [
      'Tỷ lệ dự án hoàn thành đúng tiến độ ≥ 90%',
      'Thời gian phản hồi yêu cầu ≤ 2 giờ',
      'Tỷ lệ lỗi hệ thống < 1%',
      'Đào tạo nhân sự mới trong 3 ngày làm việc',
    ],
  },
  'giám sát': {
    paragraphs: [
      'Giám sát công trình chịu trách nhiệm kiểm tra chất lượng thi công tại hiện trường, phát hiện và ghi nhận các lỗi sai sót so với bản vẽ thiết kế. Sử dụng ứng dụng để chụp ảnh, ghi chú bằng giọng nói và đánh dấu vị trí lỗi trên bản vẽ.',
      'Phối hợp chặt chẽ với nhà thầu thi công để đảm bảo các lỗi được khắc phục đúng thời hạn. Báo cáo tiến độ xử lý lỗi hàng ngày cho quản lý dự án.',
      'Thực hiện nghiệm thu từng hạng mục công việc trước khi chuyển sang giai đoạn tiếp theo, đảm bảo tuân thủ tiêu chuẩn kỹ thuật và an toàn lao động.',
    ],
    kpis: [
      'Số lượng lỗi phát hiện/ngày ≥ 5 điểm kiểm tra',
      'Tỷ lệ lỗi có ảnh chứng minh ≥ 95%',
      'Báo cáo cuối ngày trước 17:00',
      'Tỷ lệ lỗi tái phát < 5%',
    ],
  },
  'quản lý tc': {
    paragraphs: [
      'Quản lý thi công điều phối toàn bộ hoạt động tại công trường, phân công công việc cho các tổ thợ và giám sát tiến độ thi công. Đảm bảo nguồn lực (vật tư, nhân công, thiết bị) được cung cấp đầy đủ và đúng thời điểm.',
      'Tiếp nhận và xử lý các lỗi do giám sát phát hiện, lập kế hoạch sửa chữa và theo dõi đến khi hoàn tất. Phối hợp với bộ phận thiết kế khi cần điều chỉnh giải pháp kỹ thuật.',
      'Quản lý chi phí thi công, kiểm soát phát sinh và báo cáo định kỳ cho chủ đầu tư. Đảm bảo an toàn lao động và vệ sinh công trường.',
    ],
    kpis: [
      'Tiến độ thi công sai lệch ≤ 5%',
      'Tỷ lệ sửa lỗi đúng hạn ≥ 85%',
      'Chi phí phát sinh ≤ 3% tổng dự toán',
      'Không có tai nạn lao động nghiêm trọng',
    ],
  },
};

const CORE_VALUES = [
  { icon: Star, text: 'Chất lượng là danh dự', desc: 'Mỗi công trình là một tác phẩm, mang theo uy tín và trách nhiệm của chúng ta' },
  { icon: Award, text: 'Kỷ luật trong từng chi tiết', desc: 'Sự chính xác và nghiêm túc trong mọi khâu tạo nên sự khác biệt' },
  { icon: BookOpen, text: 'Sáng tạo không ngừng', desc: 'Luôn tìm kiếm giải pháp tốt hơn, hiệu quả hơn cho mọi thách thức' },
  { icon: Heart, text: 'Đồng đội là sức mạnh', desc: 'Thành công của dự án là thành công của cả đội ngũ' },
];

const PROFESSIONAL_STANDARDS = [
  'Kiểm tra bản vẽ trước khi ra công trường',
  'Chụp ảnh hiện trạng trước và sau khi sửa lỗi',
  'Ghi chú rõ ràng, đầy đủ thông tin kỹ thuật',
  'Cập nhật trạng thái lỗi trong vòng 30 phút',
  'Báo cáo tổng hợp cuối mỗi ca làm việc',
];

const CONDUCT_RULES = [
  'Luôn đội mũ bảo hộ và mang đồ bảo hộ lao động khi vào công trường',
  'Giao tiếp lịch sự, chuyên nghiệp với nhà thầu và công nhân',
  'Không sử dụng điện thoại cho mục đích cá nhân trong giờ làm việc',
  'Giữ gìn vệ sinh khu vực làm việc và công trường',
];

function getRoleKey(role: string): string {
  const lower = role.toLowerCase();
  if (lower.includes('admin') || lower.includes('quản trị')) return 'admin';
  if (lower.includes('giám sát') || lower.includes('supervisor')) return 'giám sát';
  if (lower.includes('quản lý') || lower.includes('manager') || lower.includes('tc')) return 'quản lý tc';
  return 'giám sát';
}

function getRoleBadgeColor(role: string): string {
  const key = getRoleKey(role);
  switch (key) {
    case 'admin':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    case 'giám sát':
      return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    case 'quản lý tc':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
}

export default function ProfileView({
  activeUserRole,
  userRolesList,
  projects,
  markerNotes,
  onSetActiveUserRole,
  onClose,
}: ProfileViewProps) {
  const roleKey = getRoleKey(activeUserRole.role);
  const permissions = ROLE_PERMISSIONS[roleKey] || ROLE_PERMISSIONS['giám sát'];
  const jobDesc = ROLE_JOB_DESCRIPTIONS[roleKey] || ROLE_JOB_DESCRIPTIONS['giám sát'];

  const projectCount = projects.length;
  const resolvedNotes = markerNotes.filter(
    (n) => n.tags?.includes('resolved') || n.tags?.includes('done')
  ).length;

  return (
    <div className="fixed inset-0 z-[200] bg-[#1a1a1a] overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#333] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User size={18} className="text-indigo-400" />
          <span className="text-[13px] font-black text-white tracking-wider">CÁ NHÂN</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#333] hover:bg-[#444] transition-colors"
        >
          <X size={16} className="text-[#aaa]" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-white text-2xl font-black"
              style={{ backgroundColor: activeUserRole.color || '#4f46e5' }}
            >
              {activeUserRole.avatarUrl ? (
                <img
                  src={activeUserRole.avatarUrl}
                  alt={activeUserRole.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : activeUserRole.name ? (
                activeUserRole.name.charAt(0).toUpperCase()
              ) : (
                <User size={32} />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-black text-white truncate">{activeUserRole.name}</h2>
              <span
                className={`inline-block mt-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getRoleBadgeColor(activeUserRole.role)}`}
              >
                {activeUserRole.role}
              </span>
              {activeUserRole.email && (
                <p className="text-[11px] text-[#999] mt-2 truncate">{activeUserRole.email}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 text-center">
              <div className="text-lg font-black text-white">{projectCount}</div>
              <div className="text-[9px] text-[#aaa] uppercase tracking-wide mt-0.5">Dự án</div>
            </div>
            <div className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 text-center">
              <div className="text-lg font-black text-emerald-400">{resolvedNotes}</div>
              <div className="text-[9px] text-[#aaa] uppercase tracking-wide mt-0.5">Lỗi đã xử lý</div>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        {userRolesList.length > 1 && (
          <div className="bg-[#222] border border-[#333] rounded-2xl p-4">
            <h3 className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-3">
              Chuyển vai trò
            </h3>
            <div className="space-y-2">
              {userRolesList.map((role) => {
                const isActive = role.id === activeUserRole.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => !isActive && onSetActiveUserRole(role)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 border border-indigo-500/40'
                        : 'bg-[#2a2a2a] border border-[#333] hover:border-[#444]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: role.color || '#4f46e5' }}
                    >
                      {role.name?.charAt(0)?.toUpperCase() || <User size={14} />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[12px] font-bold text-white truncate">{role.name}</div>
                      <div className="text-[10px] text-[#888]">{role.role}</div>
                    </div>
                    {isActive && (
                      <CheckCircle2 size={16} className="text-indigo-400 flex-shrink-0" />
                    )}
                    {!isActive && (
                      <ChevronRight size={14} className="text-[#555] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Permissions */}
        <div className="bg-[#222] border border-[#333] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-amber-400" />
            <h3 className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
              Quyền hạn của bạn
            </h3>
          </div>
          <div className="space-y-2.5">
            {permissions.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="text-[12px] text-[#ccc]">{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-[#222] border border-[#333] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={16} className="text-indigo-400" />
            <h3 className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
              Mô tả công việc
            </h3>
          </div>
          <div className="space-y-3">
            {jobDesc.paragraphs.map((para, idx) => (
              <p key={idx} className="text-[11px] text-[#aaa] leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* KPIs */}
          <div className="mt-4 pt-4 border-t border-[#333]">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-amber-400" />
              <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
                Chỉ tiêu KPIs
              </span>
            </div>
            <div className="space-y-2">
              {jobDesc.kpis.map((kpi, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <span className="text-[11px] text-[#aaa]">{kpi}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company Culture */}
        <div className="bg-[#222] border border-[#333] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-violet-400" />
            <h3 className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
              Văn hóa DQH Architects
            </h3>
          </div>

          {/* Core Values */}
          <div className="space-y-3 mb-5">
            {CORE_VALUES.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="flex items-start gap-3 bg-[#2a2a2a] rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-white">{value.text}</div>
                    <div className="text-[10px] text-[#888] mt-0.5 leading-relaxed">
                      {value.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Professional Standards */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={13} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
                Tiêu chuẩn giám sát chuyên nghiệp
              </span>
            </div>
            <div className="space-y-2">
              {PROFESSIONAL_STANDARDS.map((standard, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="text-[10px] font-mono text-indigo-400/60 w-4 text-right flex-shrink-0 mt-px">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <span className="text-[11px] text-[#aaa] leading-relaxed">{standard}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conduct Rules */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={13} className="text-rose-400" />
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
                Quy tắc ứng xử công trường
              </span>
            </div>
            <div className="space-y-2">
              {CONDUCT_RULES.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 size={12} className="text-rose-400/60 mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-[#aaa] leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
