import { useState, useRef } from 'react';
import { 
  X, Search, BookOpen, Clock, AlertTriangle, Check, CheckCircle2, 
  Trash2, FileText, ChevronRight, Filter, Info, Award, HelpCircle, 
  Sparkles, FolderArchive, ArrowRight, CornerDownRight, CheckSquare, Settings,
  Download, Upload
} from 'lucide-react';
import { FloorPlan, MarkerNote, WhiteboardAnnotation, Project } from '../types/floorplan';

// Pre-seeded database for 10 simulated projects with lessons learned and defect historical markers
export interface DemoProject {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'archived'; // Active (đang chạy) vs Archived (hoàn thành rút bài học)
  address: string;
  leader: string;
  completionDate?: string;
  defects: {
    title: string;
    location: string;
    transcription: string; // Voice notes
    textNotes: string; // Solution details
    tags: string[];
    severity: 'High' | 'Medium' | 'Low';
    comments: { user: string; role: string; text: string }[];
    photoData?: string | null;
  }[];
}

const INITIAL_DEMO_PROJECTS: DemoProject[] = [
  {
    id: "proj-1",
    name: "Căn hộ 3PN Estella Heights Q2",
    client: "Anh Minh Tuấn",
    status: "archived",
    address: "Xa lộ Hà Nội, An Phú, Quận 2, TPHCM",
    leader: "KTS. Võ Ngọc Quang",
    completionDate: "15/12/2025",
    defects: [
      {
        title: "Nứt rạn chân chim mối nối vách thạch cao và cột bê tông",
        location: "Khu vực giao sảnh phụ",
        transcription: "Phát hiện vết nứt chân chim kéo dài 1m5 tại dải giao nhau giữa tường thạch cao hệ thống phụ và cột bê tông chịu lực phòng khách.",
        textNotes: "Nguyên nhân do không đóng lưới thép mắt cáo chống nứt hoặc dán băng thủy tinh chống co giãn nhiệt trước khi bả matit hoàn thiện sơn nước.",
        tags: ["Vách", "Thạch cao", "Bả matit", "Sơn nước"],
        severity: "Medium",
        comments: [
          { user: "Thắng", role: "Quản Lý", text: "Sau này nghiêm cấm bả dải thạch cao giáp cột bê tông mà không sấp lưới keo búa thạch cao chịu ẩm." },
          { user: "Quang", role: "Admin", text: "Đã cho dán băng lưới thủy tinh cường lực và xả bả trét bột mastic mịn xoa bóng lại." }
        ]
      }
    ]
  },
  {
    id: "proj-2",
    name: "Penthouse Serenity Sky Villas",
    client: "Chị Thảo Vy",
    status: "archived",
    address: "Điện Biên Phủ, Võ Thị Sáu, Quận 3, TPHCM",
    leader: "KTS. Thắng Nguyễn",
    completionDate: "10/01/2026",
    defects: [
      {
        title: "Rò rỉ nước ngưng âm trần thạch cao quạt thông gió FCU",
        location: "Phòng ngủ Master tầng lửng",
        transcription: "Nước ngưng tủ điều hòa ẩm mốc thạch cao góc tủ áo quần, nhỏ giọt đều đặn xuống sàn gỗ phía dưới làm đổi màu rộp sàn gỗ nhẹ.",
        textNotes: "Ống đồng thoát nước xả ngược dốc do ty treo ống treo bị võng trùng ở giữa. Khay xả quat FCU bị bít rác bẩn keo bảo ôn.",
        tags: ["Sàn", "Trần", "FCU", "Nước", "Rò rỉ"],
        severity: "High",
        comments: [
          { user: "Thắng", role: "Quản Lý", text: "Bắt buộc thầu phụ cơ điện chỉnh dốc tối thiểu 1.5% hướng phễu thoát, quấn bảo ôn Superlon kín khít khớp nối." },
          { user: "Vy", role: "Thiết kế", text: "Đã nghiệm thu nâng dốc ty treo và xử lý bảo ôn lại hoàn chỉnh." }
        ]
      }
    ]
  },
  {
    id: "proj-3",
    name: "Biệt thự Chateau Phú Mỹ Hưng",
    client: "Bác Sĩ Nguyễn Hoàng",
    status: "archived",
    address: "Khu biệt thự lâu đài Chateau, Quận 7, TPHCM",
    leader: "KTS. Mụi Ngô",
    completionDate: "28/02/2026",
    defects: [
      {
        title: "Thấm rỉ nước chân vách kính phòng tắm đứng Master",
        location: "Phòng Master tắm đứng",
        transcription: "Nước từ vòi tắm đứng thẩm thấu luồn qua kẹp định vị vách kính, rỉ lan rộng ra mặt đá lát ngoài phòng ngủ sồi.",
        textNotes: "Không lắp đặt gờ đá tự nhiên chặn nước chênh cao 3-5cm hoặc không dán keo sủi silicone axit chịu môi trường ẩm mặn đáy vách kính chân đứng.",
        tags: ["Sàn", "Vách", "Thủy tinh", "Thấm", "Apollo"],
        severity: "High",
        comments: [
          { user: "Mụi Ngô", role: "Quản Lý Thiết Kế", text: "Rút kinh nghiệm sâu sắc cho Chateau: Tất cả phòng tắm kính phải có gờ đá sẫm chặn nước cao hơn phòng tắm khô 25mm." },
          { user: "MInh", role: "Thiết kế", text: "Đã cắt đá bổ sung và bơm dán keo Apollo chống sương trắng." }
        ]
      }
    ]
  },
  {
    id: "proj-4",
    name: "Villa Sân vườn Thảo Điền",
    client: "Mr. Johnathan Smith",
    status: "active",
    address: "Nguyễn Văn Hưởng, Thảo Điền, Quận 2, TPHCM",
    leader: "KTS. Vy Nguyễn",
    defects: [
      {
        title: "Nứt vỡ nhiệt vách kính cường lực hông nhà ngoài trời",
        location: "Kính mặt dựng phía Tây",
        transcription: "Kính hộp mặt thoáng cường lực nứt vỡ rạn góc dưới bên trái sau đợt nắng nóng đỉnh điểm chiếu rọi trực tiếp cả ngày.",
        textNotes: "Nẹp sập nhôm quá khít không có biên độ thở nco giãn nở cho tấm kính lớn, gioăng cao su bọt biển bị nén quá chết.",
        tags: ["Vách", "Thủy tinh", "Nứt kính", "Gioăng"],
        severity: "High",
        comments: [
          { user: "Vy", role: "Thiết kế", text: "Cần đổi sang gioăng cao su EPDM đàn hồi tốt hơn và chừa hở rìa sập tối thiểu 5-6mm nạp keo trám nở mút." }
        ]
      }
    ]
  },
  {
    id: "proj-5",
    name: "Căn hộ Duplex Vista Verde Q2",
    client: "Chị Mai Phương",
    status: "archived",
    address: "Đồng Văn Cống, Thạnh Mỹ Lợi, Quận 2, TPHCM",
    leader: "KTS. Khoa Nguyễn",
    completionDate: "20/03/2026",
    defects: [
      {
        title: "Thấm rột sàn ban công lội nước ngược qua cửa kính lùa",
        location: "Ban công phòng khách",
        transcription: "Cơn dông lớn rác lá cây bịt kín lấp máng thoát phễu thu sàn ban công, nước dâng tràn lên cốt khuôn cửa sổ lùa ngập hết sàn gỗ trong phòng.",
        textNotes: "Cốt sàn ban công ban đầu đổ quá cao, chênh lệch cao độ so với sàn trong nhà chỉ dưới 1cm không bảo đảm an toàn khi bão ngập phễu.",
        tags: ["Sàn", "Thấm", "Phễu thu", "Cốt cửa lùa"],
        severity: "High",
        comments: [
          { user: "Thắng", role: "Quản Lý", text: "Tiêu chuẩn DQH: Cốt sàn ban công sảnh thô đổ âm móng ít nhất 50mm so với trong phòng và lắp phễu phồng thoát rác." },
          { user: "Khoa", role: "Thiết kế", text: "Đã đục vợi bớt lớp cán nền, dán chống thấm và tạo rãnh tràn dự phòng lệch mạn mép hiên." }
        ]
      }
    ]
  },
  {
    id: "proj-6",
    name: "Shophouse Sala Đại Quang Minh",
    client: "Anh Trọng Nghĩa",
    status: "active",
    address: "Mai Chí Thọ, Thủ Thiêm, Quận 2, TPHCM",
    leader: "KS. Trung Nguyễn",
    defects: [
      {
        title: "Lệch tim đấu nối đầu phun chữa cháy Spinkler trần thạch cao",
        location: "Trần thạch cao tầng trệt cửa hàng",
        transcription: "Đầu phun chữa cháy Spinkler bị lệch 15cm so với tim trục lưới cốt ô vuông trần thạch cao hoàn thiện tháo nắp xương định dạng.",
        textNotes: "Đơn vị cứu hỏa thi công đường ống ống sắt cố định cứng trước khi đơn vị decor hoàn thiện đóng khung xương trần.",
        tags: ["Trần", "Đầu phun", "Thạch cao", "Cứu hỏa"],
        severity: "Medium",
        comments: [
          { user: "trung test", role: "giam sat", text: "Cần yêu cầu chuyển từ ống kẽm cứng sang đấu nối ống mềm Inox bọc bảo bối dải uốn lượn dễ điều chỉnh tim." }
        ]
      }
    ]
  },
  {
    id: "proj-7",
    name: "Villa Rivera Thảo Điền Q2",
    client: "Anh Quốc Bảo",
    status: "archived",
    address: "Đường số 9, Thảo Điền, Quận 2, TPHCM",
    leader: "KTS. Võ Ngọc Quang",
    completionDate: "05/04/2026",
    defects: [
      {
        title: "Sàn gỗ sồi tự nhiên bị trương nở nén ép phồng rộp",
        location: "Khu sảnh thông tầng phòng khách biệt thự",
        transcription: "Sàn gỗ tự nhiên xuất hiện gồ gợn sóng phồng hẳn lên mặt sau vài tuần chịu ảnh hưởng của nồm ẩm cao.",
        textNotes: "Kỹ thuật của tổ thầu phụ lát khít chặt sát mép vách chân tường không chừa đủ khoảng hở giãn nở nhiệt cho gỗ tấm nở.",
        tags: ["Sàn", "Gỗ", "Phồng sàn", "Khe co giãn"],
        severity: "High",
        comments: [
          { user: "Quang", role: "Admin", text: "Đã chỉ đạo thợ tháo nẹp chân len, xẻ gỗ xén vát đi 12mm quanh chu vi tường để gỗ tự do co rút." },
          { user: "Thắng", role: "Quản Lý", text: "Bài học kinh nghiệm: Lắp sàn gỗ tự nhiên bắt buộc giữ khoảng thở từ 12-15mm che bởi nẹp rầm phào." }
        ]
      }
    ]
  },
  {
    id: "proj-8",
    name: "Căn hộ Studio Vinhomes Golden River",
    client: "Chị Phương Trinh",
    status: "active",
    address: "Tôn Đức Thắng, Bến Nghé, Quận 1, TPHCM",
    leader: "KTS. Vy Nguyễn",
    defects: [
      {
        title: "Nhảy Aptomat bảo vệ quá tải nhánh tủ bếp chính ngẫu nhiên",
        location: "Góc tủ bếp bếp từ & lò nướng",
        transcription: "Aptomat nhánh ngắt nhảy sập liên tục khi người dùng đun bếp từ đồng thời nướng sấy lò vi sóng âm kệ tủ bếp.",
        textNotes: "Dây dẫn tiết diện nhánh chính kéo dây Cadivi 2.5mm2 không đủ công suất chịu nhiệt ấm lên gây sụt ampe tải, Aptomat 20A quá bé.",
        tags: ["Hệ thống điện", "Aptomat", "Quá tải", "Tủ bếp"],
        severity: "High",
        comments: [
          { user: "Vy", role: "Thiết kế", text: "Cần đi lại tuyến dây trục riêng bếp Cadivi 4.0mm2 và cụm át bảo vệ 32A độc lập để tránh cháy nổ ẩm hóc." }
        ]
      }
    ]
  },
  {
    id: "proj-9",
    name: "Nhà phố phố Khang Điền Q9",
    client: "Chú Hữu Phước",
    status: "active",
    address: "Liên Phường, Phú Hữu, Quận 9, TPHCM",
    leader: "KS. Trung Nguyễn",
    defects: [
      {
        title: "Bản lề vách kính kẹp tắm ngoài ban công bị rỉ sét loang ố",
        location: "Phòng ngủ tầng hai ban công mở",
        transcription: "Các kẹp định vị kính và vít lề inox bị phủ một lớp gỉ sét ố vàng đỏ sẫm mạ đen trông cực kỳ mất mỹ quan dự án.",
        textNotes: "Phía thầu lắp ráp vật liệu dùng inox rẻ SUS 201 không kháng nước muối sương thay vì dùng Inox SUS 304 nguyên khối hoặc 316 kháng muối biển.",
        tags: ["Vách", "Vít lề", "Rỉ sét", "Inox 316"],
        severity: "Medium",
        comments: [
          { user: "trung test", role: "giam sat", text: "Yêu cầu đo độ nhiễm mặn và thu tháo thay thế 100% bằng kẹp đồng mạ crom hoặc Inox SUS 316 tinh xảo sọc xước." }
        ]
      }
    ]
  },
  {
    id: "proj-10",
    name: "Office Studio DQH Architects",
    client: "Nội Bộ DQH",
    status: "archived",
    address: "Trần Não, An Khánh, Quận 2, TPHCM",
    leader: "KTS. Thắng Nguyễn",
    completionDate: "30/04/2026",
    defects: [
      {
        title: "Lộ vết giáp nối thấu quang vách thạch cao đèn hắt khe LED",
        location: "Phòng họp lớn",
        transcription: "Bật dải khe đèn led hắt sát vách thấy sọc bóng gồ ghề trồi lún rõ rệt tại sọc mí nối giữa các tấm thạch cao phẳng.",
        textNotes: "Do thợ sơn trét không xả bột xi măng phẳng nhám mịn hoặc không dùng đèn cao áp rọi song song mặt tường rà soát khuyết tật trước sơn lót.",
        tags: ["Vách", "Led hắt khe", "Thạch cao", "Mí nối"],
        severity: "Low",
        comments: [
          { user: "Thắng", role: "Quản Lý", text: "Xây dựng quy chuẩn buộc thầu sơn bả phải rọi đèn trợ giúp vách xả nhám mịn, bọc máng tản mica led tản sáng đều." },
          { user: "Quang", role: "Admin", text: "Đã dặm bả nhám tinh xảo lại toàn bộ các tuyến khe hắt chéo, nghiệm thu phẳng bóng 100%." }
        ]
      }
    ]
  }
];

interface LessonsLearnedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMockBluePrint: (planName: string, defects: any[], planId: string) => void;
  liveProjects?: Project[];
  liveFloorPlans?: FloorPlan[];
  liveMarkerNotes?: MarkerNote[];
  liveAnnotations?: WhiteboardAnnotation[];
  onNavigateToRealProject?: (projectId: string, floorPlanId: string, markerId: string) => void;
  onImportJSONBackup?: (data: any) => Promise<void>;
}

export default function LessonsLearnedModal({ 
  isOpen, 
  onClose, 
  onImportMockBluePrint,
  liveProjects = [],
  liveFloorPlans = [],
  liveMarkerNotes = [],
  liveAnnotations = [],
  onNavigateToRealProject,
  onImportJSONBackup
}: LessonsLearnedModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Convert live real projects into the DemoProject shape
  const liveDemoProjects: DemoProject[] = liveProjects.map(p => {
    const pFloorPlans = liveFloorPlans.filter(fp => fp.projectId === p.id);
    const pFpIds = pFloorPlans.map(fp => fp.id);
    const pMarkers = liveMarkerNotes.filter(m => pFpIds.includes(m.floorPlanId));

    return {
      id: p.id,
      name: p.name,
      client: p.client,
      status: p.status,
      address: p.address,
      leader: p.leader,
      completionDate: p.status === 'archived' ? new Date(p.createdAt).toLocaleDateString('vi-VN') : undefined,
      isLive: true,
      floorPlanIdToNavigate: pFpIds[0] || '',
      defects: pMarkers.map(m => ({
        id: m.id,
        title: m.title || 'Lỗi chưa đặt tên',
        location: m.x + '% - ' + m.y + '%',
        transcription: m.transcription || 'Không có ghi âm',
        textNotes: m.textNotes || 'Không có ghi chú',
        tags: m.tags || ['Chưa phân loại'],
        severity: (m.tags && m.tags.includes('Đã duyệt')) ? 'Low' : 'High',
        comments: m.comments ? m.comments.map(c => ({ user: c.userName, role: c.userRole, text: c.content })) : [],
        photoData: m.photoData
      }))
    };
  });

  const combinedProjectsList = [...INITIAL_DEMO_PROJECTS, ...liveDemoProjects];

  // Extract all unique tags list across pre-seeded and live projects
  const allTags = Array.from(
    new Set(
      combinedProjectsList.flatMap(p => p.defects.flatMap(d => d.tags))
    )
  );

  const searchResults = combinedProjectsList.flatMap(proj => {
    return proj.defects
      .filter(defect => {
        // Search matches query keyword inside title, transcription, textNotes, or tags
        const q = searchQuery.toLowerCase();
        const matchesQuery = !searchQuery || 
          defect.title.toLowerCase().includes(q) ||
          defect.transcription.toLowerCase().includes(q) ||
          defect.textNotes.toLowerCase().includes(q) ||
          defect.tags.some(t => t.toLowerCase().includes(q));

        // Matches tag filter
        const matchesTag = !selectedTag || defect.tags.includes(selectedTag);

        return matchesQuery && matchesTag;
      })
      .map(defect => ({
        ...defect,
        project: proj
      }));
  });

  // Convert rich pre-seeded defect schemas dynamically into interactive drawings to explore
  const loadDefectToActiveBoard = (defect: any, project: any) => {
    if (project.isLive && onNavigateToRealProject) {
      onNavigateToRealProject(project.id, project.floorPlanIdToNavigate, defect.id);
    } else {
      onImportMockBluePrint(project.name, project.defects, project.id);
      onClose();
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Dự án',
      'Khách hàng',
      'Trạng thái dự án',
      'Địa chỉ công trình',
      'Người giám sát phụ trách',
      'Tiêu đề sự cố',
      'Vị trí',
      'Thuyết minh ghi âm (Voice note)',
      'Ghi chú kỹ thuật & Giải pháp',
      'Độ nghiêm trọng',
      'Thẻ phân loại',
      'Ý kiến thảo luận'
    ];

    const rows = searchResults.map(item => {
      const commentsStr = item.comments.map(c => `${c.user} (${c.role}): ${c.text}`).join(' | ');
      const tagsStr = item.tags.join(', ');
      return [
        item.project.name,
        item.project.client,
        item.project.status === 'archived' ? 'Đã hoàn thành' : 'Đang thực hiện',
        item.project.address,
        item.project.leader,
        item.title,
        item.location,
        item.transcription,
        item.textNotes,
        item.severity,
        tagsStr,
        commentsStr
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DQH_Bai_Hoc_Kinh_Nghiem_Loi_Export_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const backup = {
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      projects: liveProjects,
      floorPlans: liveFloorPlans,
      markerNotes: liveMarkerNotes,
      annotations: liveAnnotations
    };
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DQH_Database_Sao_Luu_Loi_Project_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);
        
        if (!data.projects || !data.floorPlans || !data.markerNotes) {
          alert("Tệp sao lưu không đúng định dạng. Yêu cầu tệp JSON chứa các bảng dữ liệu gốc.");
          return;
        }

        if (onImportJSONBackup) {
          await onImportJSONBackup(data);
        } else {
          alert("Tính năng nạp sao lưu chưa được kết nối đầy đủ.");
        }
      } catch (err) {
        alert("Lỗi khi đọc tệp sao lưu JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div 
        id="lessons-learned-center-card" 
        className="bg-slate-950 border border-slate-900 w-full max-w-4xl h-[88vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header Toolbar Title */}
        <div className="flex flex-row items-center justify-between p-4 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/15 rounded-xl text-amber-400 border border-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Lịch sử sự cố</h3>
              <span className="text-[9px] font-bold text-amber-500 uppercase mt-0.5 block">Lessons Learned</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="p-2 md:px-3 md:py-1.5 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 rounded-lg cursor-pointer transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              title="Xuất Excel"
            >
              <Download className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span className="hidden md:inline">Xuất Excel</span>
            </button>

            <button
              onClick={exportToJSON}
              className="p-2 md:px-3 md:py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-lg cursor-pointer transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              title="Sao Lưu JSON"
            >
              <FolderArchive className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span className="hidden md:inline">Sao Lưu JSON</span>
            </button>

            {onImportJSONBackup && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={importJSON}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 md:px-3 md:py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  title="Nạp Sao Lưu"
                >
                  <Upload className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  <span className="hidden md:inline">Nạp Sao Lưu</span>
                </button>
              </>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Area */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 bg-slate-900/60 border-b border-slate-900">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-450 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm lỗi kỹ thuật (Ví dụ: vách, sàn, nứt...)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 text-xs font-bold text-white rounded-xl placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white text-[10px] font-bold"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => { setSelectedTag(null); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedTag === null ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            {allTags.slice(0, 8).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTag === tag 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Dense Defect Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950">
          {searchResults.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <AlertTriangle className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm font-bold">Không tìm thấy mẫu lỗi nào phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.map((defect, dIdx) => {
                // Generate a deterministic placeholder image based on the title length
                const mockImages = [
                  "https://images.unsplash.com/photo-1541888087522-823c9071c77f?w=400&q=80",
                  "https://images.unsplash.com/photo-1504307651254-35680f356f12?w=400&q=80",
                  "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80",
                  "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80",
                  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
                  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80"
                ];
                let parsedPhoto = defect.photoData as string | null | undefined;
                if (parsedPhoto && parsedPhoto.startsWith('[')) {
                  try {
                    const arr = JSON.parse(parsedPhoto);
                    if (Array.isArray(arr) && arr.length > 0) {
                      parsedPhoto = arr[0];
                    } else {
                      parsedPhoto = null;
                    }
                  } catch(e) {}
                }
                const imgUrl = parsedPhoto || mockImages[defect.title.length % mockImages.length];

                return (
                  <div 
                    key={dIdx} 
                    className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col cursor-pointer"
                    onClick={() => loadDefectToActiveBoard(defect, defect.project)}
                  >
                    {/* Thumbnail */}
                    <div className="h-32 w-full relative overflow-hidden bg-slate-800">
                      <img src={imgUrl} alt="Lỗi" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                      
                      {/* Severity Badge */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${
                          defect.severity === 'High' ? 'bg-rose-500 text-white' : 
                          defect.severity === 'Medium' ? 'bg-amber-500 text-slate-950' : 
                          'bg-slate-700 text-white'
                        }`}>
                          {defect.severity}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col gap-2">
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors" title={defect.title}>
                        {defect.title}
                      </h4>
                      
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {defect.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                            {t}
                          </span>
                        ))}
                        {defect.tags.length > 3 && (
                          <span className="text-[9px] text-slate-500 font-medium">+{defect.tags.length - 3}</span>
                        )}
                      </div>
                    </div>

                    {/* Hover Overlay Button */}
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sửa lỗi ngay</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>DQH Architects Lessons Learned Knowledge Base</span>
          <span>© 2026 DQH Architects - Đúc kết kinh nghiệm bàn giao dự án</span>
        </div>
      </div>
    </div>
  );
}
