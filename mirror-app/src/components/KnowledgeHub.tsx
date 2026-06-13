import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  CheckSquare,
  GraduationCap,
  Search,
  ChevronRight,
  AlertTriangle,
  Shield,
  HardHat,
  Lightbulb,
  Star,
} from 'lucide-react';
import { Project, FloorPlan, MarkerNote } from '../types';

interface KnowledgeHubProps {
  projects: Project[];
  floorPlans: FloorPlan[];
  markerNotes: MarkerNote[];
  onClose: () => void;
}

type SubTab = 'library' | 'checklist' | 'training';

const CATEGORIES = ['Nội thất', 'Kết cấu', 'MEP', 'Ốp lát', 'Hoàn thiện', 'Trần & Đèn'] as const;

type Category = (typeof CATEGORIES)[number];

interface DefaultDefect {
  title: string;
  category: Category;
  description: string;
  solution: string;
}

const DEFAULT_DEFECTS: DefaultDefect[] = [
  {
    title: 'Nứt tường sau trát',
    category: 'Kết cấu',
    description: 'Vết nứt chân chim hoặc nứt dọc xuất hiện sau khi trát 7-14 ngày.',
    solution: 'Đục bỏ lớp trát cũ, xử lý lưới sợi thuỷ tinh, trát lại đúng quy trình bảo dưỡng.',
  },
  {
    title: 'Sàn gỗ phồng rộp',
    category: 'Nội thất',
    description: 'Sàn gỗ bị phồng, cong vênh do ẩm hoặc thi công không đúng kỹ thuật.',
    solution: 'Kiểm tra độ ẩm nền, lắp lại với khe co giãn đúng tiêu chuẩn ≥8mm.',
  },
  {
    title: 'Rò rỉ ống cấp nước',
    category: 'MEP',
    description: 'Hiện tượng rò rỉ tại các mối nối ống, van khoá hoặc đường ống âm tường.',
    solution: 'Thử áp lực 10 bar trong 30 phút trước khi đổ bê tông, thay thế mối nối lỗi.',
  },
  {
    title: 'Gạch ốp bong tróc',
    category: 'Ốp lát',
    description: 'Gạch ốp tường/nền bị bong tróc, phồng rộp sau 1-3 tháng thi công.',
    solution: 'Xử lý bề mặt nền, sử dụng keo dán chuyên dụng, để khe mạch đúng kích thước.',
  },
  {
    title: 'Sơn bong tróc, loang màu',
    category: 'Hoàn thiện',
    description: 'Bề mặt sơn bị bong, phấn hoá hoặc không đều màu sau khi thi công.',
    solution: 'Chà nhám, sơn lót chống kiềm, sơn 2-3 lớp phủ đúng thời gian khô giữa các lớp.',
  },
  {
    title: 'Trần thạch cao võng',
    category: 'Trần & Đèn',
    description: 'Trần thạch cao bị võng, nứt hoặc xệ do khung xương yếu hoặc ẩm.',
    solution: 'Gia cố khung xương, thay tấm thạch cao chống ẩm, kiểm tra ty treo đúng khoảng cách ≤600mm.',
  },
];

interface ChecklistPhase {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: string[];
}

const CHECKLIST_PHASES: ChecklistPhase[] = [
  {
    id: 'structure',
    name: 'Kết cấu (Móng & Thô)',
    icon: <Shield size={16} />,
    items: [
      'Kiểm tra cao độ tim cột, tim dầm theo bản vẽ',
      'Nghiệm thu cốt thép trước khi đổ bê tông',
      'Kiểm tra kích thước, vị trí hộp gen kỹ thuật',
      'Đo độ thẳng đứng của cột, tường (sai số ≤5mm/3m)',
      'Kiểm tra bề mặt bê tông sau tháo coppha (rỗ, nứt)',
      'Xác nhận vị trí chờ thép sàn, cầu thang đúng bản vẽ',
    ],
  },
  {
    id: 'mep',
    name: 'MEP (Điện & Nước)',
    icon: <AlertTriangle size={16} />,
    items: [
      'Thử áp lực đường ống cấp nước (10 bar / 30 phút)',
      'Kiểm tra độ dốc ống thoát nước (≥2%)',
      'Đo điện trở tiếp đất hệ thống chống sét',
      'Nghiệm thu tuyến ống điện âm tường trước trát',
      'Kiểm tra vị trí ổ cắm, công tắc theo bản vẽ',
      'Thử vận hành hệ thống PCCC, quạt hút',
    ],
  },
  {
    id: 'tiling',
    name: 'Ốp lát',
    icon: <Star size={16} />,
    items: [
      'Kiểm tra độ phẳng nền trước khi ốp (sai số ≤3mm/2m)',
      'Xác nhận hướng vân gạch, layout theo bản vẽ',
      'Gõ kiểm tra độ bám dính gạch (không rỗng >15%)',
      'Kiểm tra khe mạch đều, thẳng hàng',
      'Nghiệm thu độ dốc sàn khu vệ sinh về phễu thu',
    ],
  },
  {
    id: 'interior',
    name: 'Nội thất',
    icon: <HardHat size={16} />,
    items: [
      'Kiểm tra kích thước tủ, kệ theo bản vẽ thiết kế',
      'Nghiệm thu màu sắc, chất liệu vật liệu đúng mẫu duyệt',
      'Kiểm tra cửa đóng mở êm, khoá hoạt động tốt',
      'Đo khoảng cách ổ cắm đến mặt bàn, tủ bếp',
      'Kiểm tra khe hở sàn gỗ với chân tường (8-10mm)',
      'Nghiệm thu ray trượt ngăn kéo, bản lề tủ',
      'Xác nhận vị trí lắp đặt thiết bị vệ sinh đúng bản vẽ',
    ],
  },
  {
    id: 'finishing',
    name: 'Hoàn thiện',
    icon: <CheckSquare size={16} />,
    items: [
      'Kiểm tra bề mặt sơn đều màu, không loang, chảy',
      'Nghiệm thu ron silicone khu vực tiếp giáp vật liệu',
      'Kiểm tra nẹp nhôm, nẹp chỉ thẳng hàng, chắc chắn',
      'Vệ sinh tổng thể công trình trước bàn giao',
      'Chụp ảnh hiện trạng toàn bộ trước khi bàn giao',
    ],
  },
];

interface TrainingCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  duration: string;
}

const TRAINING_CARDS: TrainingCard[] = [
  {
    id: 'supervision',
    icon: <Shield size={20} className="text-indigo-400" />,
    title: 'Quy trình giám sát công trình',
    description:
      'Tìm hiểu quy trình giám sát từ khởi công đến bàn giao, các bước kiểm tra chất lượng, lập biên bản và báo cáo tiến độ.',
    duration: '45 phút',
  },
  {
    id: 'common-mistakes',
    icon: <AlertTriangle size={20} className="text-amber-400" />,
    title: 'Lỗi thường gặp theo giai đoạn',
    description:
      'Phân tích các lỗi phổ biến trong từng giai đoạn thi công: phần thô, MEP, hoàn thiện và cách phòng tránh hiệu quả.',
    duration: '30 phút',
  },
  {
    id: 'communication',
    icon: <BookOpen size={20} className="text-emerald-400" />,
    title: 'Kỹ năng giao tiếp công trường',
    description:
      'Kỹ năng phối hợp với nhà thầu, chủ đầu tư và đội thi công. Cách truyền đạt yêu cầu kỹ thuật rõ ràng, hiệu quả.',
    duration: '25 phút',
  },
  {
    id: 'safety',
    icon: <HardHat size={20} className="text-rose-400" />,
    title: 'An toàn lao động',
    description:
      'Quy định an toàn lao động trên công trường, trang bị bảo hộ, quy trình xử lý sự cố và phòng chống cháy nổ.',
    duration: '35 phút',
  },
  {
    id: 'acceptance',
    icon: <GraduationCap size={20} className="text-violet-400" />,
    title: 'Nghiệm thu đúng chuẩn',
    description:
      'Hướng dẫn nghiệm thu từng hạng mục theo TCVN, cách lập biên bản nghiệm thu và xử lý khi phát hiện lỗi.',
    duration: '40 phút',
  },
];

const categoryColorMap: Record<Category, string> = {
  'Nội thất': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Kết cấu': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'MEP': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Ốp lát': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Hoàn thiện': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Trần & Đèn': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

export default function KnowledgeHub({
  projects,
  floorPlans,
  markerNotes,
  onClose,
}: KnowledgeHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>('structure');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Build reference cards from real markerNotes
  const referenceCards = useMemo(() => {
    if (markerNotes.length === 0) return [];
    return markerNotes.map((note) => {
      const plan = floorPlans.find((fp) => fp.id === note.floorPlanId);
      const project = plan?.projectId
        ? projects.find((p) => p.id === plan.projectId)
        : null;
      return {
        ...note,
        projectName: project?.name || 'Dự án không xác định',
      };
    });
  }, [markerNotes, floorPlans, projects]);

  const hasRealData = referenceCards.length > 0;

  // Filter logic for library tab
  const filteredDefects = useMemo(() => {
    let items = DEFAULT_DEFECTS;
    if (selectedCategory) {
      items = items.filter((d) => d.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [selectedCategory, searchQuery]);

  const filteredReferenceCards = useMemo(() => {
    let items = referenceCards;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.transcription.toLowerCase().includes(q) ||
          c.textNotes.toLowerCase().includes(q) ||
          c.projectName.toLowerCase().includes(q)
      );
    }
    return items;
  }, [referenceCards, searchQuery]);

  const toggleCheck = (phaseId: string, idx: number) => {
    const key = `${phaseId}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'library', label: 'Thư viện lỗi', icon: <BookOpen size={14} /> },
    { key: 'checklist', label: 'Checklist', icon: <CheckSquare size={14} /> },
    { key: 'training', label: 'Đào tạo', icon: <GraduationCap size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-[#1a1a1a] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-[#333] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-400" />
            <h1 className="text-white font-bold text-sm tracking-wide">
              THƯ VIỆN & ĐÀO TẠO
            </h1>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#333] hover:bg-[#444] transition-colors"
          >
            <X size={16} className="text-[#aaa]" />
          </button>
        </div>

        {/* Sub-tab buttons */}
        <div className="flex gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                activeSubTab === tab.key
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-[#2a2a2a] text-[#888] border border-[#333] hover:bg-[#333]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-20">
        {/* Sub-tab 1: Thư viện lỗi */}
        {activeSubTab === 'library' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]"
              />
              <input
                type="text"
                placeholder="Tìm kiếm lỗi, nguyên nhân..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#222] border border-[#333] rounded-xl text-white text-[12px] placeholder-[#666] focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
                  !selectedCategory
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-[#2a2a2a] text-[#888] border-[#333] hover:bg-[#333]'
                }`}
              >
                Tất cả
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
                    selectedCategory === cat
                      ? categoryColorMap[cat]
                      : 'bg-[#2a2a2a] text-[#888] border-[#333] hover:bg-[#333]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Real marker notes */}
            {hasRealData && (
              <div className="space-y-3">
                <p className="text-[10px] text-[#888] uppercase tracking-wider font-medium">
                  Ghi chú từ dự án ({filteredReferenceCards.length})
                </p>
                {filteredReferenceCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-[#222] border border-[#333] rounded-xl p-3 space-y-2"
                  >
                    <div className="flex gap-3">
                      {card.photoData && (
                        <img
                          src={card.photoData}
                          alt={card.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-[12px] font-semibold truncate">
                          {card.title}
                        </h3>
                        <p className="text-[10px] text-indigo-400 mt-0.5">
                          {card.projectName}
                        </p>
                        {card.transcription && (
                          <p className="text-[10px] text-[#999] mt-1 line-clamp-2">
                            {card.transcription}
                          </p>
                        )}
                      </div>
                    </div>
                    {card.textNotes && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
                        <p className="text-[9px] text-emerald-400 font-medium mb-0.5">
                          Giải pháp
                        </p>
                        <p className="text-[10px] text-emerald-200/80 line-clamp-2">
                          {card.textNotes}
                        </p>
                      </div>
                    )}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-[#333] text-[#aaa] rounded text-[9px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Default defect examples */}
            <div className="space-y-3">
              {hasRealData && (
                <p className="text-[10px] text-[#888] uppercase tracking-wider font-medium mt-2">
                  Lỗi thường gặp tham khảo
                </p>
              )}
              {filteredDefects.map((defect, idx) => (
                <div
                  key={idx}
                  className="bg-[#222] border border-[#333] rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white text-[12px] font-semibold">
                          {defect.title}
                        </h3>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${categoryColorMap[defect.category]}`}
                        >
                          {defect.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#999] leading-relaxed">
                        {defect.description}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-[#555] flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
                    <p className="text-[9px] text-emerald-400 font-medium mb-0.5">
                      Giải pháp
                    </p>
                    <p className="text-[10px] text-emerald-200/80">
                      {defect.solution}
                    </p>
                  </div>
                </div>
              ))}
              {filteredDefects.length === 0 && !hasRealData && (
                <div className="text-center py-8">
                  <Search size={24} className="mx-auto text-[#555] mb-2" />
                  <p className="text-[12px] text-[#888]">
                    Không tìm thấy kết quả phù hợp
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-tab 2: Checklist nghiệm thu */}
        {activeSubTab === 'checklist' && (
          <div className="space-y-3">
            <p className="text-[11px] text-[#999] mb-1">
              Danh sách kiểm tra nghiệm thu theo từng giai đoạn thi công
            </p>
            {CHECKLIST_PHASES.map((phase) => {
              const isExpanded = expandedPhase === phase.id;
              const checkedCount = phase.items.filter(
                (_, i) => checkedItems[`${phase.id}-${i}`]
              ).length;
              return (
                <div
                  key={phase.id}
                  className="bg-[#222] border border-[#333] rounded-xl overflow-hidden"
                >
                  {/* Phase header */}
                  <button
                    onClick={() =>
                      setExpandedPhase(isExpanded ? null : phase.id)
                    }
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">{phase.icon}</span>
                      <span className="text-white text-[12px] font-semibold">
                        {phase.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#888]">
                        {checkedCount}/{phase.items.length}
                      </span>
                      <ChevronRight
                        size={14}
                        className={`text-[#666] transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Checklist items */}
                  {isExpanded && (
                    <div className="border-t border-[#333] px-3 py-2 space-y-1">
                      {phase.items.map((item, idx) => {
                        const key = `${phase.id}-${idx}`;
                        const isChecked = checkedItems[key] || false;
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleCheck(phase.id, idx)}
                            className="w-full flex items-start gap-2.5 py-1.5 text-left group"
                          >
                            <div
                              className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-[#555] group-hover:border-[#777]'
                              }`}
                            >
                              {isChecked && (
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                  fill="none"
                                >
                                  <path
                                    d="M2 5L4.5 7.5L8 3"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-[11px] leading-relaxed transition-colors ${
                                isChecked
                                  ? 'text-[#666] line-through'
                                  : 'text-[#ccc] group-hover:text-white'
                              }`}
                            >
                              {item}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Sub-tab 3: Đào tạo giám sát */}
        {activeSubTab === 'training' && (
          <div className="space-y-4">
            <p className="text-[11px] text-[#999] mb-1">
              Tài liệu đào tạo dành cho giám sát công trình
            </p>

            {/* Training cards */}
            <div className="space-y-3">
              {TRAINING_CARDS.map((card) => (
                <div
                  key={card.id}
                  className="bg-[#222] border border-[#333] rounded-xl p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] border border-[#333] flex items-center justify-center flex-shrink-0">
                      {card.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-[12px] font-semibold mb-1">
                        {card.title}
                      </h3>
                      <p className="text-[10px] text-[#999] leading-relaxed mb-2.5">
                        {card.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#666]">
                          ⏱ {card.duration}
                        </span>
                        <button
                          disabled
                          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] text-indigo-400 font-medium opacity-60 cursor-not-allowed"
                        >
                          Xem chi tiết
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips section */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <Lightbulb size={16} className="text-amber-400" />
                <h3 className="text-amber-300 text-[12px] font-semibold">
                  Mẹo hữu ích
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 text-[10px] mt-0.5">•</span>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    Luôn chụp ảnh trước và sau khi sửa lỗi để lưu hồ sơ đối
                    chiếu.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 text-[10px] mt-0.5">•</span>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    Ghi chú vị trí lỗi trực tiếp trên bản vẽ để dễ tra cứu và
                    theo dõi.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 text-[10px] mt-0.5">•</span>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    Sử dụng checklist nghiệm thu cho mỗi giai đoạn để không bỏ
                    sót hạng mục.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 text-[10px] mt-0.5">•</span>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    Báo cáo lỗi nghiêm trọng ngay lập tức cho chủ đầu tư và
                    nhà thầu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
