"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { PortfolioManager } from './PortfolioManager';
import { 
  Shield, 
  Users, 
  FileText, 
  CheckCircle, 
  MapPin, 
  Clock, 
  Calendar, 
  Compass, 
  Layers, 
  Search, 
  Award, 
  Heart, 
  Wrench, 
  CheckSquare, 
  DollarSign, 
  ChevronRight, 
  Building,
  Star,
  Sparkles,
  Laptop,
  Smartphone,
  ChevronDown,
  Check,
  Activity,
  ArrowRight,
  TrendingUp
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM CONSTANTS (DQH Quiet Luxury Brand Guidelines)
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  cream: '#F5F2EC',
  warmWhite: '#F8F5F0',
  charcoal: '#1A1814',
  textDark: '#2C2920',
  stone: '#8A8070',
  stoneLight: '#C4C0B8',
  gold: '#B8913A',
  goldLight: '#D4BC95',
  border: 'rgba(44,41,32,0.10)',
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA & RESOURCES
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  { id: 1, num: "01", cat: "Biệt thự · Thủ Đức", title: "The Lumé Residence", img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", desc: "Diện tích 450m2. Thiết kế theo tinh thần Quiet Luxury với vật liệu chủ đạo là đá tự nhiên Travertine và gỗ sồi nhập khẩu." },
  { id: 2, num: "02", cat: "Nhà phố · Quận 2", title: "The Horizon House", img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80", desc: "Diện tích 280m2. Ứng dụng triết lý Modern Tropical Biophilic đưa ánh sáng tự nhiên và cây xanh xen kẽ vào không gian." },
  { id: 3, num: "03", cat: "Penthouse · Quận 7", title: "The Verena Penthouse", img: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80", desc: "Diện tích 320m2. Thiết kế tối giản tinh tế, tập trung vào tỷ lệ hình khối và sự kiềm chế màu sắc." },
  { id: 4, num: "04", cat: "Boutique Resort · Đà Lạt", title: "Arden Boutique Resort", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80", desc: "Công trình nghỉ dưỡng cao cấp hòa quyện với thiên nhiên sương mù, sử dụng limewash sơn vôi tự nhiên." },
];

const STAFF_PORTFOLIO = [
  {
    name: "Đỗ Quang Hải",
    role: "KTS Trưởng & Founder",
    experience: "15+ Năm Kinh Nghiệm",
    bio: "Tốt nghiệp ĐH Kiến Trúc TP.HCM. 15 năm thiết kế các biệt thự cao cấp. Định hướng triết lý 'Quiet Luxury' tại DQH — không gian tinh tế từ tỷ lệ, không phô trương từ chi tiết.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
  },
  {
    name: "Nguyễn Minh Tuấn",
    role: "Giám Đốc Sáng Tạo",
    experience: "10+ Năm Kinh Nghiệm",
    bio: "Chuyên gia về vật liệu tự nhiên và ánh sáng gián tiếp. Đảm bảo mọi moodboard thiết kế đạt chuẩn thẩm mỹ cao cấp nhất, kết hợp hài hòa giữa đá, gỗ và vải sợi thô zellige.",
    img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80"
  },
  {
    name: "Trần Hoàng Nam",
    role: "Kỹ Sư Kết Cấu Cao Cấp",
    experience: "12+ Năm Kinh Nghiệm",
    bio: "Chuyên môn kết cấu đảm bảo các phương án kiến trúc vượt nhịp lớn, giấu cột âm tường tinh tế. Biến các ý tưởng bay bổng trên bản vẽ 3D thành hiện thực vững chãi.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80"
  },
  {
    name: "Lê Văn Khoa",
    role: "Quản Lý Dự Án & Thi Công",
    experience: "8+ Năm Kinh Nghiệm",
    bio: "Giám sát kỹ thuật hiện trường. Quản lý chặt chẽ BOQ, kiểm soát chất lượng từ xưởng gỗ nội thất đến công trình thô, đảm bảo tiến độ bàn giao đúng cam kết.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80"
  }
];

const CASE_STUDIES = [
  {
    title: "Chị gọi lúc 10 giờ tối",
    tag: "Tử tế làm đầu (Story A)",
    desc: "Gia chủ chị N. gọi điện lúc 10h tối thứ Sáu khi mái nhà penthouse gặp sự cố thấm dột do bão lớn tràn qua khe kính của giếng trời (không thuộc phạm vi thi công của DQH). Nhận thông tin, KTS Minh Tuấn và kỹ thuật viên Khoa trực tiếp mang bạt chuyên dụng đến hiện trường lúc 11h đêm mưa gió để hỗ trợ phủ bạt và bắn keo tạm thời, bảo vệ toàn bộ sàn gỗ tự nhiên cho phòng của bé. Chị N. xúc động chia sẻ: 'Chị gọi điện chỉ mong được hướng dẫn cách xử lý tạm, không ngờ các em lại phi trực tiếp qua công trình trong đêm mưa gió.'"
  },
  {
    title: "Anh ấy từ chối 3 triệu",
    tag: "Chuyên môn & Đạo đức (Story B)",
    desc: "Trong quá trình nghiệm thu lắp ráp hệ tủ Horizon, một thầu phụ nhỏ đề nghị bồi dưỡng riêng 3 triệu đồng cho KTS Hoàng Nam để bỏ qua một khe hở lệch 1.5mm ở vách tủ giáp tường thạch cao. KTS Nam kiên quyết từ chối, yêu cầu thầu phụ tháo ra bào và lắp ráp lại từ đầu, mất thêm 3 ngày sản xuất lại. Anh Nam nói: 'Tôi không thể nhìn vào khe hở đó mỗi ngày và biết mình đã chọn tiền thay vì tiêu chuẩn hoàn thiện.' Sự kiên định này đã bảo vệ tuyệt đối chất lượng khớp shadow line cho chủ nhà."
  },
  {
    title: "48 giờ trước bàn giao",
    tag: "Nhiệt huyết hành động (Story C)",
    desc: "Hai ngày trước lễ bàn giao chìa khóa, chủ nhà thay đổi ý định và muốn đổi tông màu sơn phòng ngủ phụ từ xám đá sang màu trắng ấm. Mặc dù hợp đồng hoàn toàn cho phép từ chối hoặc tính thêm phí phát sinh trễ hạn, đội sơn của DQH đã ở lại làm việc xuyên đêm, sơn lại 3 lớp để bàn giao đúng ngày giờ tốt cho gia chủ mà không tính thêm bất kỳ một chi phí phát sinh nào."
  }
];

const MASTER_STEPS = [
  { step: "01", title: "Khảo sát & Tư vấn", duration: "Trong 48 giờ", executor: "KTS phụ trách & PM", details: "Đo đạc hiện trạng bằng máy quét laser, phỏng vấn chuyên sâu thói quen sinh hoạt của gia đình, phân tích hướng nắng hướng gió, đề xuất mặt bằng công năng 2D sơ bộ hoàn toàn miễn phí." },
  { step: "02", title: "Thiết kế Concept 3D", duration: "7 - 14 Ngày", executor: "Team Concept & Creative Director", details: "Lên phối cảnh 3D các không gian chính, dựng moodboard bảng mẫu vật liệu thực tế, cân đối ánh sáng ảo. DQH hỗ trợ chỉnh sửa không giới hạn đến khi gia chủ hài lòng 100%." },
  { step: "03", title: "Bản vẽ Kỹ thuật & BOQ", duration: "10 - 15 Ngày", executor: "Kỹ sư cơ điện & Bộ phận dự toán", details: "Triển khai bộ bản vẽ chi tiết thi công (50-120 trang), lập bảng bóc tách khối lượng BOQ chính xác đến từng con ốc, mã sơn và ray trượt. Cam kết chi phí BOQ cố định, không phát sinh chi phí ẩn." },
  { step: "04", title: "Ký hợp đồng & Kick-off", duration: "1 - 2 Ngày", executor: "Ban giám đốc & Toàn bộ team dự án", details: "Ký hợp đồng thi công với tổng giá cố định, lịch thanh toán theo milestone rõ ràng và điều khoản phạt trễ tiến độ. Tổ chức buổi họp khởi động dự án giới thiệu KTS, Kỹ sư kết cấu và Giám sát hiện trường với gia chủ." },
  { step: "05", title: "Thi công phần thô", duration: "60 - 90 Ngày", executor: "Đội ngũ kỹ sư & Giám sát hiện trường", details: "Đổ bê tông cốt thép móng kết cấu chắc chắn, đi hệ thống ME&P (Cadivi/Tiền Phong). Điểm chạm cốt lõi: Test ngâm nước toilet và ban công 72 giờ liên tục, mời gia chủ nghiệm thu trực tiếp trước khi lấp nền." },
  { step: "06", title: "Hoàn thiện & Nội thất", duration: "30 - 45 Ngày", executor: "Xưởng gỗ DQH & Đội hoàn thiện", details: "Sản xuất nội thất gỗ theo bản vẽ CAD tại xưởng gỗ DQH rộng 1.500m2. Sơn phủ mờ mộc tự nhiên. Vận chuyển lắp ráp tại công trình, kiểm tra khớp shadow line 3mm chuyển tiếp tường thạch cao." },
  { step: "07", title: "Nghiệm thu & Bàn giao", duration: "7 Ngày", executor: "Gia chủ & KTS trưởng", details: "Cùng gia chủ cầm bản checklist nghiệm thu 120 điểm rà soát từng chi tiết. Khắc phục toàn bộ các lỗi nhỏ (defect list) trong 7 ngày trước khi chính thức bàn giao hồ sơ hoàn công và chìa khóa." },
  { step: "08", title: "Bảo hành & Chăm sóc sau", duration: "Bảo hành kết cấu 10 năm", executor: "Hotline 24/7 của DQH", details: "Bảo hành kết cấu 10 năm, chống thấm 5 năm, hoàn thiện nội thất 5 năm. Phản hồi thông tin bảo trì bảo hành trong vòng 2 giờ làm việc, kỹ thuật viên có mặt xử lý tại hiện trường trong vòng 24 - 48 giờ." }
];

const TECHNICAL_STANDARDS = {
  design: [
    { title: "Tỷ lệ Solid : Void = 3 : 1", desc: "Giữ 25% diện tích tường làm void (khe, khoảng trống, âm trần) giúp căn phòng có khoảng thở tự nhiên, không nhồi nhét tủ kệ." },
    { title: "Furniture Scale theo trần", desc: "Chiều cao sofa, bàn trà, kệ tivi được tính toán riêng theo chiều cao thông thủy của trần để không tạo cảm giác bức bối." },
    { title: "Độ chuẩn xác Shadow Gap", desc: "Cấu hình khe âm thạch cao 3mm và khe chân tủ nội thất 2mm tạo đường viền bóng tối tự nhiên sắc sảo và hiện đại." }
  ],
  construction: [
    { title: "Chống thấm toilet 3 lớp đặc chủng", desc: "Thi công màng chống thấm polyme liên tục, ngâm thử nước ngập sàn 72h và ký biên bản nghiệm thu chống thấm." },
    { title: "Chống nứt tường bằng lưới thép mắt cáo", desc: "Đóng lưới thép mắt cáo tại tất cả vị trí tiếp giáp bê tông và tường gạch trước khi tô trát vữa để loại bỏ vết nứt." },
    { title: "Lắp đặt Mockup ánh sáng hiện trường", desc: "Trước khi thi công trần thạch cao, lắp thử hệ LED 2700K/3000K để kiểm tra độ mịn hắt sáng thực tế trên tường." }
  ],
  checklist: [
    { title: "Khe cạnh dán ABS gỗ ≤ 0.5mm", desc: "Cạnh gỗ ép chỉ nhiệt phẳng tuyệt đối, không có vết keo thừa hay hở nẹp." },
    { title: "Bản lề đóng mở nhẹ tự đóng góc", desc: "Toàn bộ bản lề hơi Häfele đóng êm dịu, không phát ra tiếng động, cửa đóng khít đều." },
    { title: "Mạch lát gạch phẳng mạch đều ≤ 1.5mm", desc: "Khoảng cách mạch gạch thẳng tắp bằng ke chữ thập, dùng máy hút chân không kiểm tra độ phẳng không lệch cạnh." },
    { title: "Không có gạch rỗng khi gõ thử", desc: "Kiểm tra gõ gậy cao su 100% bề mặt gạch lát sàn, không chấp nhận bất kỳ vị trí ộp hay rỗng vữa." }
  ]
};

const WARRANTY_ITEMS = [
  { item: "Kết cấu bê tông cốt thép", time: "10 Năm", note: "Không tính hao mòn vật lý tự nhiên" },
  { item: "Màng chống thấm toilet/ban công", time: "5 Năm", note: "Ngâm thử nước 72h đạt tiêu chuẩn" },
  { item: "Nội thất gỗ & lắp đặt joinery", time: "5 Năm", note: "Bảo hành cong vênh, co ngót, mối mọt" },
  { item: "Đường ống điện nước âm tường", time: "3 Năm", note: "Đi ống PPR chịu lực cao chống rò rỉ" },
  { item: "Bề mặt sơn hoàn thiện", time: "2 Năm", note: "Bảo hành bong tróc tự nhiên" },
  { item: "Phụ kiện bản lề, ray kéo (Häfele/Blum)", time: "2 Năm", note: "Bảo hành 1 đổi 1 lỗi nhà sản xuất" }
];

const COST_BREAKDOWN = [
  { label: "Vật tư chính hãng", pct: 52, color: "#FAF8F4", desc: "Đá tự nhiên, gỗ sồi, sơn Jotun, phụ kiện Häfele chính hãng có hóa đơn VAT" },
  { label: "Nhân công tay nghề cao", pct: 22, color: "#D4BC95", desc: "Đội ngũ thợ mộc lành nghề tại xưởng gỗ và thợ nề lành nghề tại công trình" },
  { label: "Giám sát kỹ thuật 6/7 ngày", pct: 8, color: "#B8913A", desc: "Kỹ sư có mặt giám sát trực tiếp hiện trường, nghiệm thu theo checklist" },
  { label: "Quản lý & Thiết kế", pct: 10, color: "#8A8070", desc: "Bản vẽ 2D/3D chi tiết, kỹ sư kết cấu vượt nhịp và kiến trúc sư trưởng" },
  { label: "Dự phòng bảo hành 10 năm", pct: 5, color: "#C4C0B8", desc: "Quỹ trích lập dự phòng phục vụ bảo hành kết cấu dài hạn cho ngôi nhà" },
  { label: "Vận hành công ty tối ưu", pct: 3, color: "#444120", desc: "Chi phí văn phòng đại diện và quản lý tối giản" }
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT MAIN
// ─────────────────────────────────────────────────────────────────────────────

export function PortfolioLanding({ isPreview = false }: { isPreview?: boolean }) {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(!isPreview);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(isPreview);
  const [showShareManager, setShowShareManager] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // High-Tech Simulators State
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'DESIGN' | 'CONSTRUCTION' | 'CHECKLIST'>('DESIGN');
  const [activeDiaryTab, setActiveDiaryTab] = useState<'GANTT' | 'DIARY'>('GANTT');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Real Project Data from Supabase
  const [realProject, setRealProject] = useState<any>(null);
  const [realTasks, setRealTasks] = useState<any[]>([]);
  const [realLogs, setRealLogs] = useState<any[]>([]);
  const [loadingProject, setLoadingProject] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isPreview) {
      setLoading(false);
      setAuthenticated(true);
    } else if (token) {
      fetchPortfolio();
    } else {
      setError('Đường dẫn chia sẻ không hợp lệ.');
      setLoading(false);
    }
  }, [token, isPreview]);

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_shares')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        setError('Link không tồn tại hoặc đã bị xóa.');
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Link này đã hết hạn.');
        setLoading(false);
        return;
      }

      setPortfolio(data);
      if (!data.passcode) {
        setAuthenticated(true);
      }

      if (data.project_id) {
        fetchRealProjectData(data.project_id);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealProjectData = async (projectId: string) => {
    setLoadingProject(true);
    try {
      const [projRes, tasksRes, logsRes] = await Promise.all([
        supabase.from('construction_projects').select('*').eq('id', projectId).single(),
        supabase.from('construction_tasks').select('*').eq('project_id', projectId).order('created_at'),
        supabase.from('construction_daily_logs').select('*').eq('project_id', projectId).order('date', { ascending: false })
      ]);
      if (projRes.data) setRealProject(projRes.data);
      if (tasksRes.data) setRealTasks(tasksRes.data);
      if (logsRes.data) setRealLogs(logsRes.data);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu công trình thực tế:", err);
    } finally {
      setLoadingProject(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portfolio?.passcode === pin) {
      setAuthenticated(true);
    } else {
      alert('Mã PIN không chính xác.');
    }
  };

  // Generate dynamic dates for Simulated Logs (Today, Yesterday, 3 Days Ago)
  const getSimulatedLogs = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);

    const formatDate = (d: Date) => {
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return [
      {
        date: formatDate(today),
        title: 'Nghiệm thu lắp đặt tủ bếp đảo & mặt đá tự nhiên Travertine',
        content: 'Kiểm tra khớp dán cạnh acrylic góc bếp đảo phẳng nhẵn, khe shadow line 3mm quanh tủ joinery đều tăm tắp. Phụ kiện bản lề hơi Häfele đóng mở tự giảm chấn êm ái, ray hộc kéo mở toàn phần chịu tải tốt.',
        status: 'Đạt chuẩn 100%',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'
      },
      {
        date: formatDate(yesterday),
        title: 'Thi công lắp đặt hệ thống đèn LED âm trần hắt sáng 3000K phòng khách',
        content: 'Thử nghiệm mockup ánh sáng hiện trường lúc 18h. LED thanh giấu góc thạch cao phân bổ ánh sáng mịn màng không chói mắt, độ chuẩn màu CRI > 90 phản chiếu chính xác vách đá travertine.',
        status: 'Đạt chuẩn 100%',
        image: 'https://images.unsplash.com/photo-1565538810844-1e119eae811d?w=600&q=80'
      },
      {
        date: formatDate(threeDaysAgo),
        title: 'Nghiệm thu chống thấm toilet phòng master (ngâm nước 72 giờ)',
        content: 'Sau 72 giờ ngâm nước liên tục dưới sự chứng kiến của chủ nhà, cốt trần tầng dưới khô ráo hoàn toàn, không phát hiện vết ẩm loang. DQH tiến hành lấp cát, tráng vữa bảo vệ màng chống thấm.',
        status: 'Đạt chuẩn 100%',
        image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80'
      }
    ];
  };

  const simulatedLogs = getSimulatedLogs();

  const toggleChecklist = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0] text-[#2C2920] font-sans">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] text-[#2C2920] font-sans px-4 text-center">
        <h1 className="font-serif text-3xl mb-4">Oops!</h1>
        <p className="text-[#8A8070]">{error}</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] text-[#2C2920] font-sans px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#2C2920]/10 text-center">
          <div className="w-16 h-16 bg-[#F8F5F0] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#C4C0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="font-serif text-2xl mb-2 text-[#2C2920]">{portfolio?.title}</h2>
          <p className="text-sm text-[#8A8070] mb-8">Vui lòng nhập Mã PIN để xem Hồ sơ năng lực này.</p>
          
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Nhập mã PIN"
              className="w-full text-center tracking-widest bg-[#F8F5F0] border border-[#2C2920]/10 px-4 py-3 rounded-lg focus:outline-none focus:border-[#2C2920] transition-colors font-mono"
              autoFocus
            />
            <button type="submit" className="w-full text-xs tracking-[0.12em] uppercase text-[#F8F5F0] bg-[#1A1814] px-8 py-3.5 hover:bg-[#B8913A] transition-colors duration-300 rounded-lg">
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-[#F8F5F0] text-[#2C2920] selection:bg-[#B8913A] selection:text-white relative">
      
      {/* ── NAVBAR ── */}
      <nav className={`${isPreview ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-20 px-6 md:px-16 py-5 flex items-center justify-between transition-all duration-500 ${
        isScrolled 
          ? 'bg-[#F8F5F0]/95 backdrop-blur-md border-b border-[#2C2920]/10 shadow-sm' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <a href="#" className={`font-serif text-xl font-semibold tracking-wide transition-colors duration-300 ${
          isScrolled ? 'text-[#2C2920]' : 'text-[#F5F2EC]'
        }`}>
          DQH <span className="font-light italic text-[#B8913A]">Signature</span>
        </a>
        <div className="hidden lg:flex gap-9">
          {["Công trình", "Đội ngũ", "Quy trình phối hợp", "Tiêu chuẩn kỹ thuật", "Báo giá & Chi phí", "Bảo hành & Nhật ký", "Ý kiến khách hàng"].map((label, idx) => (
            <a 
              key={idx} 
              href={`#section-${idx}`} 
              className={`text-xs tracking-[0.12em] uppercase transition-colors duration-300 font-medium ${
                isScrolled 
                  ? 'text-[#8A8070] hover:text-[#2C2920]' 
                  : 'text-[#C4C0B8] hover:text-[#F8F5F0]'
              }`}
            >
              {label}
            </a>
          ))}
        </div>
        <a 
          href="#contact" 
          className={`text-xs tracking-[0.1em] uppercase px-5 py-2.5 transition-all duration-300 font-semibold rounded-sm ${
            isScrolled 
              ? 'text-[#F8F5F0] bg-[#1A1814] hover:bg-[#B8913A]' 
              : 'text-[#1A1814] bg-[#F5F2EC] hover:bg-[#B8913A] hover:text-[#F8F5F0]'
          }`}
        >
          Đặt Lịch Tư Vấn
        </a>
      </nav>

      {/* ── HERO ── */}
      <section 
        className="min-h-screen pt-28 pb-16 flex flex-col justify-center px-6 md:px-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2A2820 0%, #1C1C1A 60%, #0E0E0C 100%)',
        }}
      >
        {/* Decorative vertical line */}
        <div 
          className="absolute right-12 md:right-32 top-0 bottom-0 pointer-events-none hidden sm:block opacity-60"
          style={{
            width: '0.5px',
            background: 'linear-gradient(to bottom, transparent 10%, rgba(184, 155, 106, 0.3) 50%, transparent 90%)',
          }}
        >
          <span 
            className="absolute top-1/2 right-[-2.8rem] transform rotate-90 translate-y-[-50%] text-[10px] tracking-[0.3em] text-[#8A8070] white-space-nowrap uppercase font-sans font-medium"
          >
            Est. 30 . 12 . 2020
          </span>
        </div>

        <div className="relative z-10 max-w-[720px] w-full mx-auto md:mx-0">
          <Reveal>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#8A8070] mb-8 font-sans font-medium">
              INTERIOR DESIGN &amp; BUILD STUDIO · TP.HCM
            </p>
          </Reveal>
          
          <Reveal delay={100}>
            <h1 className="font-serif text-[clamp(3rem,8vw,5.8rem)] font-light leading-[1.05] mb-6 text-[#F5F2EC]">
              Define<br />
              <em className="italic text-[#F5F2EC] font-light">Quality</em><br />
              Housing
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="font-serif italic font-light text-[clamp(1.2rem,2.5vw,1.75rem)] text-[#B8913A] mb-14">
              "Làm nghề tử tế."
            </p>
          </Reveal>

          {/* 3 meta info cards */}
          <Reveal delay={300}>
            <div className="flex gap-16 md:gap-24 flex-wrap mb-14 max-w-[600px]">
              {[
                { label: 'MÔ HÌNH', value: 'Design & Build' },
                { label: 'PHÂN KHÚC', value: 'Cao cấp' },
                { label: 'TRIẾT LÝ', value: 'Quiet Luxury' },
              ].map((m, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8070] font-sans font-medium">{m.label}</p>
                  <p className="text-sm text-[#F5F2EC] font-sans font-medium">{m.value}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Action buttons */}
          <Reveal delay={400}>
            <div className="flex items-center gap-6 flex-wrap">
              <a 
                href="#section-0" 
                className="bg-[#B8913A] hover:bg-[#B8913A]/85 text-[#1A1814] text-xs tracking-[0.15em] uppercase px-8 py-3.5 font-sans font-semibold transition-all duration-300 cursor-pointer rounded-sm"
              >
                Xem các công trình
              </a>
              <a 
                href="#section-3" 
                className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-[#C4C0B8] hover:text-[#F5F2EC] hover:gap-3 font-sans font-semibold transition-all duration-300 cursor-pointer"
              >
                Bộ tiêu chuẩn mẫu →
              </a>
            </div>
          </Reveal>
        </div>

        {/* Scroll down indicator dot/line */}
        <div 
          className="absolute bottom-10 right-10 w-[0.5px] h-10 hidden md:block"
          style={{
            background: 'linear-gradient(to bottom, #B8913A, transparent)',
          }}
        />
      </section>

      {/* ── SECTION 0: CÔNG TRÌNH NỔI BẬT ── */}
      <section id="section-0" className="px-6 md:px-16 py-24 bg-[#F8F5F0] border-b border-[#2C2920]/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-2">(năng lực thiết kế)</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2920]">
              Thiết kế có gu &amp; <em className="not-italic text-[#B89B6A]">Công trình thành công</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {PROJECTS.map((proj) => (
              <div key={proj.id} className="group border border-[#2C2920]/10 bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="overflow-hidden aspect-[16/10] relative">
                  <img 
                    src={proj.img} 
                    alt={proj.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute top-4 left-4 bg-[#F8F5F0]/90 backdrop-blur-md px-3 py-1 rounded text-xs font-serif italic text-[#B8913A]">{proj.num}</div>
                </div>
                <div className="p-6">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#8A8070] block mb-2">{proj.cat}</span>
                  <h3 className="font-serif text-xl font-light text-[#2C2920] mb-3 group-hover:text-[#B8913A] transition-colors">{proj.title}</h3>
                  <p className="text-xs text-[#8A8070] leading-relaxed">{proj.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 1: ĐỘI NGŨ MẠNH & SƠ ĐỒ BỘ MÁY D&B ── */}
      <section id="section-1" className="px-6 md:px-16 py-24 bg-[#F5F2EC] border-b border-[#2C2920]/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-16">
            <div className="lg:col-span-1">
              <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-2">(bộ máy tổ chức)</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2920] mb-6">
                Đội ngũ mạnh,<br />
                <em className="not-italic text-[#B8913A]">Design &amp; Build</em> trọn vẹn
              </h2>
              <p className="text-sm text-[#8A8070] leading-relaxed">
                Tại DQH, kiến trúc sư và kỹ sư giám sát công trình cùng làm việc dưới một mái nhà. Chúng tôi loại bỏ hoàn toàn việc kiến trúc sư đổ lỗi cho thợ thi công làm sai, hoặc thợ thi công chê bản vẽ không thực tế. Mọi thành viên đều chung mục tiêu: sản phẩm cuối cùng hoàn hảo nhất.
              </p>
            </div>
            
            {/* Sơ đồ bộ máy D&B */}
            <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-[#2C2920]/10 shadow-sm space-y-6">
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#2C2920] font-bold pb-4 border-b border-[#2C2920]/10 flex items-center gap-2">
                <Building size={16} className="text-[#B8913A]" /> SƠ ĐỒ PHỐI HỢP DESIGN &amp; BUILD
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: "Khảo Sát & Concept", team: "Phòng Thiết Kế", desc: "KTS khảo sát hiện trạng, đo cốt, lập moodboard ý tưởng phù hợp lối sống chủ nhà." },
                  { title: "Bản Vẽ Kỹ Thuật & BOQ", team: "Phòng Kỹ Thuật & Dự Toán", desc: "Kỹ sư tính kết cấu chịu lực, bóc tách cấu tạo gỗ, lập bảng dự toán BOQ chi tiết." },
                  { title: "Sản Xuất & Thi Công", team: "Xưởng Gỗ & Đội Giám Sát", desc: "Nội thất sản xuất tại xưởng gỗ DQH, kỹ sư cơ điện lắp đặt thiết bị và thi công hoàn thiện." }
                ].map((step, idx) => (
                  <div key={idx} className="bg-[#F8F5F0] p-4 rounded-lg border border-[#2C2920]/5 space-y-2 relative">
                    <div className="absolute top-3 right-3 text-[10px] font-bold text-[#C4C0B8]">0{idx + 1}</div>
                    <h4 className="text-xs font-bold text-[#2C2920]">{step.title}</h4>
                    <span className="inline-block text-[9px] tracking-[0.1em] uppercase text-[#B8913A] font-semibold">{step.team}</span>
                    <p className="text-[11px] text-[#8A8070] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio nhân sự nòng cốt */}
          <div className="border-t border-[#2C2920]/10 pt-16">
            <h3 className="font-serif text-xl font-light text-[#2C2920] mb-8">Hồ sơ chuyên môn nhân sự chủ chốt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STAFF_PORTFOLIO.map((staff, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-[#2C2920]/10 overflow-hidden p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#F8F5F0]">
                    <img src={staff.img} alt={staff.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#2C2920]">{staff.name}</h4>
                    <p className="text-[10px] tracking-[0.12em] uppercase text-[#B8913A] font-semibold mb-1">{staff.role}</p>
                    <span className="text-[10px] text-[#8A8070] font-medium block">{staff.experience}</span>
                  </div>
                  <p className="text-xs text-[#8A8070] leading-relaxed border-t border-[#2C2920]/5 pt-3">
                    {staff.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: QUY TRÌNH PHỐI HỢP & CHI TIẾT HIỆN TRƯỜNG ── */}
      <section id="section-2" className="px-6 md:px-16 py-24 bg-[#F8F5F0] border-b border-[#2C2920]/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-2">(vận hành chi tiết)</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2920]">
              Quy trình phối hợp <em className="not-italic text-[#B8913A]">liên phòng ban</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Interactive Vertical 8-Step Stepper */}
            <div className="lg:col-span-2 space-y-3">
              {MASTER_STEPS.map((step, idx) => {
                const isExpanded = expandedStep === idx;
                return (
                  <div 
                    key={idx} 
                    className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'border-[#B8913A] shadow-md' : 'border-[#2C2920]/10 hover:border-[#2C2920]/30 shadow-sm'
                    }`}
                  >
                    <button 
                      onClick={() => setExpandedStep(isExpanded ? null : idx)}
                      className="w-full flex justify-between items-center p-5 text-left focus:outline-none cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-serif text-xl text-[#B8913A] italic font-light">{step.step}</span>
                        <div>
                          <h4 className="text-xs font-bold text-[#2C2920] uppercase tracking-wider">{step.title}</h4>
                          <span className="text-[10px] text-[#8A8070] font-mono">{step.duration}</span>
                        </div>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`text-[#8A8070] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#B8913A]' : ''}`} 
                      />
                    </button>
                    
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-[#2C2920]/5 bg-[#F5F2EC]/30 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase text-[#8A8070]">
                          <div>
                            <span className="block font-bold">Người thực hiện:</span>
                            <span className="text-[#2C2920]">{step.executor}</span>
                          </div>
                          <div>
                            <span className="block font-bold">Thời hạn trung bình:</span>
                            <span className="text-[#2C2920]">{step.duration}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[#2C2920] leading-relaxed border-t border-[#2C2920]/5 pt-3">
                          {step.details}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chi tiết hiện trường & Test vật liệu ánh sáng */}
            <div className="lg:col-span-1 bg-[#F5F2EC] p-6 rounded-xl border border-[#2C2920]/10 space-y-6 h-fit shadow-sm">
              <h3 className="font-serif text-lg font-light text-[#2C2920] border-b border-[#2C2920]/10 pb-3">Chi tiết điểm chạm hiện trường</h3>
              <div className="space-y-4 text-xs text-[#8A8070] leading-relaxed">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#2C2920]">1. Quy trình test ánh sáng &amp; vật liệu:</h4>
                  <p>Mẫu vật liệu thật được đặt tại công trình để test màu sắc dưới ánh sáng mặt trời góc 12h và 17h, đảm bảo không bị đổi màu sai lệch.</p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#2C2920]">2. Mockup ánh sáng:</h4>
                  <p>Lắp đặt tạm hệ trần thạch cao nhỏ tại công trình, test vị trí giấu LED và khoảng hắt sáng để xác định khoảng cách tối ưu (chỉ số shadow line 10-15mm).</p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#2C2920]">3. Nghiệm thu tại xưởng gỗ:</h4>
                  <p>Khách hàng được mời tới xưởng gỗ DQH xem thô sản phẩm nội thất trước khi sơn phủ bề mặt mờ, kiểm tra độ sắc sảo của các đường ghép mộng gỗ.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TRÌNH DUYỆT TIÊU CHUẨN KỸ THUẬT SỐ ── */}
      <section id="section-3" className="px-6 md:px-16 py-24 bg-[#F5F2EC] border-b border-[#2C2920]/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            <div className="lg:col-span-1">
              <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-2">(kỹ thuật thi công)</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2920] mb-6">
                Tiêu chuẩn thiết kế &amp; <em className="not-italic text-[#B8913A]">Checklist 120 điểm</em>
              </h2>
              <p className="text-sm text-[#8A8070] leading-relaxed mb-6">
                DQH số hóa toàn bộ tiêu chuẩn kỹ thuật thiết kế và thi công vào ứng dụng quản lý. Mọi chi tiết thiết kế và hạng mục hoàn thiện đều được nhân sự kiểm tra chéo theo checklist nghiêm ngặt dưới đây.
              </p>
              <div className="bg-[#B8913A]/5 border border-[#B8913A]/20 p-4 rounded-lg">
                <span className="text-[9px] font-mono tracking-widest text-[#B8913A] uppercase font-bold block mb-1">MẬT ĐỘ BẢO MẬT</span>
                <p className="text-[11px] text-[#8A8070] leading-relaxed">Bộ tiêu chuẩn hiển thị dưới dạng <strong>Teaser rút gọn</strong> để bảo vệ tài sản trí tuệ DQH. Liên hệ KTS để đăng ký tài khoản chính thức xem bản Full.</p>
              </div>
            </div>
            
            {/* Interactive App Screen Mockup */}
            <div className="lg:col-span-2 bg-[#1A1814] text-[#F8F5F0] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col min-h-[460px]">
              
              {/* App Screen Header */}
              <div className="bg-[#111110] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="text-[10px] tracking-[0.2em] font-mono uppercase text-[#8A8070] font-bold">DQH STANDARDS ENGINE v1.2</div>
                <div className="text-[10px] font-mono text-[#B8913A] bg-[#B8913A]/10 px-2 py-0.5 rounded">CONNECTED</div>
              </div>

              {/* Tabs selector */}
              <div className="bg-[#151514] px-4 py-2 flex gap-1 border-b border-white/5 overflow-x-auto">
                {[
                  { id: 'DESIGN', label: 'Tiêu chuẩn Thiết kế' },
                  { id: 'CONSTRUCTION', label: 'Tiêu chuẩn Thi công' },
                  { id: 'CHECKLIST', label: 'Checklist 120 điểm (Gỗ & Lát)' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-[#B8913A] text-[#1A1814]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* App Screen Content Panel */}
              <div className="p-6 flex-1 bg-[#1A1814] overflow-y-auto custom-scrollbar">
                {activeTab === 'DESIGN' && (
                  <ul className="space-y-5">
                    {TECHNICAL_STANDARDS.design.map((item, i) => (
                      <li key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B8913A]" />
                          <h4 className="text-xs font-bold uppercase tracking-wide text-white">{item.title}</h4>
                        </div>
                        <p className="text-[11px] text-[#C4C0B8] leading-relaxed pl-3.5 font-sans font-normal">{item.desc}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'CONSTRUCTION' && (
                  <ul className="space-y-5">
                    {TECHNICAL_STANDARDS.construction.map((item, i) => (
                      <li key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B8913A]" />
                          <h4 className="text-xs font-bold uppercase tracking-wide text-white">{item.title}</h4>
                        </div>
                        <p className="text-[11px] text-[#C4C0B8] leading-relaxed pl-3.5 font-sans font-normal">{item.desc}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'CHECKLIST' && (
                  <div className="space-y-4">
                    <div className="text-[10px] text-[#8A8070] italic font-sans mb-3">Nhấp để chọn đánh dấu nghiệm thu thử nghiệm:</div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {TECHNICAL_STANDARDS.checklist.map((item, i) => {
                        const isChecked = !!checkedItems[i];
                        return (
                          <div 
                            key={i}
                            onClick={() => toggleChecklist(i)}
                            className={`flex gap-3 items-start p-3 rounded-lg border transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-[#B8913A]/10 border-[#B8913A]/40 text-[#FAF8F4]' 
                                : 'bg-white/5 border-white/5 text-[#C4C0B8] hover:border-white/10'
                            }`}
                          >
                            <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isChecked ? 'bg-[#B8913A] border-[#B8913A] text-[#1A1814]' : 'border-white/20'
                            }`}>
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="space-y-1">
                              <h4 className={`text-xs font-bold tracking-wide uppercase transition-colors ${isChecked ? 'text-white' : 'text-[#FAF8F4]'}`}>{item.title}</h4>
                              <p className="text-[11px] leading-relaxed opacity-80">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: MINH BẠCH BÁO GIÁ & CHI PHÍ ── */}
      <section id="section-4" className="px-6 md:px-16 py-24 bg-[#F8F5F0] border-b border-[#2C2920]/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-2">(cam kết minh bạch)</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2920]">
              Tại sao giá DQH là <em className="not-italic text-[#B89B6A]">Giá đúng giá trị?</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Cost Breakdown percentage display */}
            <div className="lg:col-span-7 bg-white p-8 rounded-xl border border-[#2C2920]/10 shadow-sm space-y-6">
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#2C2920] font-bold flex items-center gap-2">
                <DollarSign size={16} className="text-[#B8913A]" /> CƠ CẤU PHÂN BỔ 100% CHI PHÍ HỢP ĐỒNG
              </h3>
              
              {/* HTML/CSS Bar Chart Stack */}
              <div className="h-6 w-full rounded-md overflow-hidden flex shadow-inner">
                {COST_BREAKDOWN.map((item, idx) => (
                  <div 
                    key={idx} 
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }} 
                    className="h-full border-r border-[#2C2920]/5 last:border-0 relative group"
                    title={`${item.label}: ${item.pct}%`}
                  />
                ))}
              </div>

              {/* Grid detail metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {COST_BREAKDOWN.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start border-b border-[#2C2920]/5 pb-3 last:border-0">
                    <div style={{ backgroundColor: item.color }} className="w-3.5 h-3.5 rounded-sm border border-[#2C2920]/10 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2C2920]">{item.label}</span>
                        <span className="font-mono text-[10px] text-[#B8913A] bg-[#B8913A]/5 px-1.5 py-0.2 rounded font-bold">{item.pct}%</span>
                      </div>
                      <p className="text-[10px] text-[#8A8070] mt-1 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Price comparison card */}
            <div className="lg:col-span-5 bg-[#1A1814] text-[#F8F5F0] p-8 rounded-xl border border-white/5 space-y-6 shadow-md relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8913A]/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <h3 className="font-serif text-lg font-light text-[#B8913A] mb-4">Đối chiếu rủi ro khi chọn đơn vị giá rẻ</h3>
                <div className="space-y-4">
                  {[
                    { title: "Báo giá rẻ hơn 15% - Phát sinh 30%", desc: "Báo giá gộp chung chung tính theo mét vuông dẫn đến phát sinh chi phí thạch cao,MEP và đinh ốc phụ trội trong quá trình xây thực tế." },
                    { title: "Sử dụng vật liệu nhái / Không nhãn mác", desc: "Không cung cấp hóa đơn chứng từ chính hãng, thay phụ kiện ray trượt bản lề nhái chỉ sau 1 năm là gỉ sét, kẹt ray tủ bếp." },
                    { title: "Không có dự toán BOQ cam kết", desc: "Mập mờ chi tiết, khi phát sinh lỗi đùn đẩy trách nhiệm bắt chủ nhà tự chịu chi phí dỡ ra làm lại." }
                  ].map((risk, idx) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-[#FAF8F4] flex items-center gap-2">
                        <span className="text-red-500 font-mono font-bold">✕</span> {risk.title}
                      </h4>
                      <p className="text-[10px] text-[#C4C0B8] leading-relaxed pl-4">{risk.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 mt-6">
                <p className="text-[11px] text-[#B8913A] font-bold uppercase tracking-wider">DQH cam kết 3 KHÔNG:</p>
                <p className="text-[10px] text-[#C4C0B8] mt-1 leading-relaxed">Không phát sinh chi phí ẩn • Không sử dụng vật liệu nhái • Không trễ tiến độ phạt hợp đồng.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: BẢO HÀNH & NHẬT KÝ THI CÔNG REAL-TIME ── */}
      <section id="section-5" className="px-6 md:px-16 py-24 bg-[#F5F2EC] border-b border-[#2C2920]/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-2">(đồng hành dài lâu)</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2920]">
              Nhật ký thi công &amp; <em className="not-italic text-[#B8913A]">Cam kết bảo hành vàng</em>
            </h2>
          </div>

          {/* Homeowner App Portal Real-time Simulation */}
          <div className="bg-[#1A1814] text-[#F8F5F0] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-16 flex flex-col min-h-[500px]">
            
            {/* Screen Mockup Top Bar */}
            <div className="bg-[#111110] px-6 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-[#C4C0B8] tracking-widest uppercase font-bold">CỔNG TIẾN ĐỘ KHÁCH HÀNG REAL-TIME</span>
              </div>
              <div className="text-[10px] font-mono text-[#B8913A] bg-[#B8913A]/10 px-3 py-1 rounded">
                DỰ ÁN: {realProject ? realProject.name : 'THE HORIZON HOUSE (DEMO)'}
              </div>
            </div>

            {/* Sub-tabs selector */}
            <div className="bg-[#151514] px-4 py-2 flex gap-1 border-b border-white/5">
              <button 
                onClick={() => setActiveDiaryTab('GANTT')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  activeDiaryTab === 'GANTT' ? 'bg-[#B8913A] text-[#1A1814]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tiến độ Gantt
              </button>
              <button 
                onClick={() => setActiveDiaryTab('DIARY')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  activeDiaryTab === 'DIARY' ? 'bg-[#B8913A] text-[#1A1814]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Nhật ký thi công hàng ngày
              </button>
            </div>

            {/* Simulated Data Render */}
            <div className="p-6 flex-1 bg-[#1A1814] overflow-y-auto custom-scrollbar">
              
              {/* Gantt Progress list */}
              {activeDiaryTab === 'GANTT' && (
                <div className="space-y-5">
                  {loadingProject ? (
                    <div className="text-center py-10 font-mono text-gray-400">Đang tải tiến độ thực tế...</div>
                  ) : realProject && realTasks.length > 0 ? (
                    realTasks.map((t, idx) => (
                      <div key={idx} className="space-y-1.5 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="font-bold text-white uppercase">{t.name}</span>
                          <span className="text-[#B8913A] font-bold">{t.progress || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div style={{ width: `${t.progress || 0}%` }} className="h-full bg-[#B8913A] rounded-full" />
                        </div>
                      </div>
                    ))
                  ) : (
                    SIMULATED_TASKS.map((t, idx) => (
                      <div key={idx} className="space-y-1.5 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="font-bold text-white uppercase">{t.name}</span>
                          <span className="text-[#B8913A] font-bold">{t.progress}% ({t.status})</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div style={{ width: `${t.progress}%` }} className="h-full bg-[#B8913A] rounded-full" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Diary Feed */}
              {activeDiaryTab === 'DIARY' && (
                <div className="space-y-6">
                  {loadingProject ? (
                    <div className="text-center py-10 font-mono text-gray-400">Đang tải nhật ký thực tế...</div>
                  ) : realProject && realLogs.length > 0 ? (
                    realLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-4 items-start border-b border-white/5 pb-5 last:border-0 last:pb-0">
                        <div className="text-[10px] font-mono text-[#B8913A] bg-[#B8913A]/10 px-2.5 py-1 rounded shrink-0">
                          {log.date ? new Date(log.date).toLocaleDateString('vi-VN') : ''}
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{log.title}</h4>
                          <p className="text-[11px] text-[#C4C0B8] leading-relaxed font-sans font-normal">{log.content}</p>
                          {log.media_urls && Array.isArray(log.media_urls) && log.media_urls.length > 0 && (
                            <div className="flex gap-2 flex-wrap pt-2">
                              {log.media_urls.map((imgUrl, i) => (
                                <img key={i} src={imgUrl} className="w-20 h-20 object-cover rounded border border-white/10" alt="Hiện trường" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    simulatedLogs.map((log, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-5 items-start border-b border-white/5 pb-6 last:border-0 last:pb-0">
                        <div className="w-full sm:w-28 text-[10px] font-mono text-[#B8913A] bg-[#B8913A]/10 px-2.5 py-1 rounded text-center shrink-0">
                          {log.date}
                        </div>
                        <div className="flex-1 space-y-2.5">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{log.title}</h4>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">{log.status}</span>
                          </div>
                          <p className="text-[11px] text-[#C4C0B8] leading-relaxed font-sans font-normal">{log.content}</p>
                          <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/15">
                            <img src={log.image} alt="Nghiệm thu thực địa" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Warranty Table & Stories */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-8">
            <div className="lg:col-span-7 bg-white p-8 rounded-xl border border-[#2C2920]/10 shadow-sm space-y-5">
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#2C2920] font-bold flex items-center gap-2">
                <Award size={16} className="text-[#B89B6A]" /> CHÍNH SÁCH BẢO HÀNH CHÍNH THỨC CỦA DQH
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-[#2C2920]/10 text-[#8A8070]">
                      <th className="py-2.5 font-bold uppercase">Hạng mục bảo hành</th>
                      <th className="py-2.5 font-bold uppercase text-center">Thời gian</th>
                      <th className="py-2.5 font-bold uppercase">Ghi chú điều kiện</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WARRANTY_ITEMS.map((w, idx) => (
                      <tr key={idx} className="border-b border-[#2C2920]/5 last:border-0 hover:bg-[#F5F2EC]/30">
                        <td className="py-3 font-semibold text-[#2C2920]">{w.item}</td>
                        <td className="py-3 font-bold text-center text-[#B8913A]">{w.time}</td>
                        <td className="py-3 text-[#8A8070]">{w.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Showcase 3 emotional stories */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#2C2920] font-bold flex items-center gap-2 pl-2">
                <Heart size={16} className="text-[#B89B6A]" /> CÂU CHUYỆN SỰ TỬ TẾ &amp; TRÁCH NHIỆM
              </h3>
              
              <div className="space-y-4">
                {CASE_STUDIES.map((study, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-[#2C2920]/10 shadow-sm space-y-3">
                    <span className="text-[9px] tracking-[0.15em] uppercase text-[#B8913A] font-bold bg-[#F5F2EC] px-2.5 py-1 rounded inline-block">
                      {study.tag}
                    </span>
                    <h4 className="font-serif text-md font-bold text-[#2C2920]">{study.title}</h4>
                    <p className="text-xs text-[#8A8070] leading-relaxed italic border-l-2 border-[#B8913A] pl-3.5">
                      "{study.desc}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ý kiến khách hàng cũ */}
          <div className="border-t border-[#2C2920]/10 pt-20 mt-20">
            <h3 className="font-serif text-xl font-light text-[#2C2920] mb-12 text-center">Ý kiến từ những chủ nhà đã đồng hành cùng DQH</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Chị Minh Châu", role: "Chủ nhà · Biệt thự Thủ Đức 2024", text: "Từ buổi gặp đầu tiên, họ đã hiểu hoàn toàn tầm nhìn của chúng tôi. Thiết kế cuối cùng cảm giác rất tự nhiên — từng phòng đều chảy liền mạch." },
                { name: "Anh Tuấn Anh", role: "Chủ nhà · Nhà phố Quận 3 2023", text: "Checklist nghiệm thu của DQH còn dài hơn danh sách của vợ tôi. Bàn giao xong thực sự không có gì để phàn nàn — từng chi tiết đều hoàn hảo." },
                { name: "Chị Hồng Nhung", role: "Chủ nhà · Căn hộ Quận 7 2022", text: "Ban công thấm sau 1 năm, gọi buổi sáng — chiều cùng ngày đã có kỹ thuật viên đến. Bảo hành không phải lời hứa, đó là cam kết thực sự." }
              ].map((feedback, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-[#2C2920]/10 space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-1 text-[#B8913A]"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                  <p className="text-xs text-[#8A8070] leading-relaxed">"{feedback.text}"</p>
                  <div className="pt-3 border-t border-[#2C2920]/5">
                    <h4 className="text-xs font-bold text-[#2C2920]">{feedback.name}</h4>
                    <span className="text-[10px] text-[#8A8070]">{feedback.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: PHÁP LÝ & ĐỊNH HÌNH UY TÍN ── */}
      <section className="px-6 md:px-16 py-24 bg-[#1A1814] text-[#F8F5F0]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-xs tracking-[0.22em] uppercase text-[#B8913A]">(pháp lý doanh nghiệp)</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white">
                Bộ máy vận hành &amp; <em className="not-italic text-[#B89B6A]">Cơ sở pháp lý uy tín</em>
              </h2>
              <div className="space-y-4 text-sm text-[#C4C0B8] leading-relaxed">
                <p>
                  <strong>Công ty TNHH Kiến Trúc &amp; Nội Thất DQH</strong><br />
                  Mã số thuế: 03168894xx do Sở Kế hoạch và Đầu tư TP.HCM cấp. Mọi giao dịch hợp đồng thiết kế, báo giá và thi công đều được thực hiện minh bạch qua pháp nhân doanh nghiệp, bảo vệ quyền lợi pháp lý cao nhất cho khách hàng.
                </p>
                <p>
                  <strong>Showroom &amp; Văn phòng:</strong> Quận 7, TP. Hồ Chí Minh. Nơi tiếp khách, trưng bày các mẫu vật liệu travertine, zellige, gỗ sồi mẫu thật để test trực tiếp.
                </p>
                <p>
                  <strong>Xưởng sản xuất nội thất DQH:</strong> Quy mô 1,500m2 tại Bình Chánh với máy móc gia công tự động hiện đại, đảm bảo độ chuẩn xác đường cắt shadow gap gỗ dưới 2mm.
                </p>
              </div>
            </div>

            {/* Form liên hệ chốt sales */}
            <div id="contact" className="bg-[#F8F5F0] text-[#1A1814] p-8 rounded-xl border border-[#2C2920]/10 space-y-6 shadow-md">
              <h3 className="font-serif text-xl font-light text-[#B8913A]">Đăng ký tư vấn Quiet Luxury</h3>
              <p className="text-xs text-[#8A8070] leading-relaxed">Đội ngũ KTS của DQH sẽ liên hệ trực tiếp trong vòng 2 giờ để trao đổi sâu về định hướng không gian của gia đình.</p>
              <form onSubmit={(e) => { e.preventDefault(); alert("✅ Gửi yêu cầu thành công. DQH sẽ liên hệ anh/chị ngay!"); }} className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[#8A8070] mb-1 font-bold">Họ và tên</label>
                  <input type="text" required placeholder="Nguyễn Văn A" className="w-full bg-[#F5F2EC] border border-[#2C2920]/10 px-3 py-2 text-xs rounded focus:outline-none focus:border-[#B8913A]" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[#8A8070] mb-1 font-bold">Số điện thoại</label>
                  <input type="tel" required placeholder="0900 000 000" className="w-full bg-[#F5F2EC] border border-[#2C2920]/10 px-3 py-2 text-xs rounded focus:outline-none focus:border-[#B8913A]" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[#8A8070] mb-1 font-bold">Lời nhắn / Yêu cầu</label>
                  <textarea rows={3} placeholder="Mô tả sơ bộ về dự án của anh/chị..." className="w-full bg-[#F5F2EC] border border-[#2C2920]/10 px-3 py-2 text-xs rounded focus:outline-none focus:border-[#B8913A] resize-none" />
                </div>
                <button type="submit" className="w-full text-xs tracking-[0.12em] uppercase text-[#F8F5F0] bg-[#1A1814] py-3.5 hover:bg-[#B8913A] transition-colors duration-300 font-bold rounded">Gửi yêu cầu tư vấn</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A1814] px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#FAF8F4]/10 text-[#C4C0B8] text-xs">
        <p className="font-serif text-lg font-light tracking-wide text-white">DQH <span className="italic text-[#B8913A]">Signature</span></p>
        <p>© 2020 – 2025 DQH Architects. Bảo lưu mọi quyền.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#B8913A]">Instagram</a>
          <a href="#" className="hover:text-[#B8913A]">Facebook</a>
          <a href="#" className="hover:text-[#B8913A]">Behance</a>
        </div>
      </footer>

      {/* ── FLOATING PREVIEW ANCHOR CONTROL ── */}
      {isPreview && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A1814]/90 backdrop-blur-md border border-[#FAF8F4]/10 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-5 text-stone-100 text-sm font-sans animate-fade-in transition-all">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-stone-300 tracking-wide text-xs uppercase">Xem trước Portfolio</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <button 
            onClick={() => setShowShareManager(true)}
            className="bg-[#B8913A] hover:bg-[#B8913A]/85 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Tạo &amp; Chia sẻ link
          </button>
        </div>
      )}

      {/* ── SHOWCASE CONTROL PANEL (For Sales Reps) ── */}
      {isPreview && (
        <div className="fixed bottom-24 right-6 z-[100] bg-[#1A1814]/95 border border-[#B8913A]/20 p-4 rounded-xl shadow-2xl w-64 text-[#F8F5F0] font-sans text-xs space-y-3 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-[#B8913A] font-bold uppercase tracking-wider">
            <Sparkles size={14} /> Showcase Tooltip
          </div>
          <p className="text-gray-400 leading-tight">Nhấp nhanh để cuộn và bật tính năng chốt khách tương ứng:</p>
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <button 
              onClick={() => {
                document.getElementById('section-2')?.scrollIntoView({ behavior: 'smooth' });
                setExpandedStep(4); // Step 5: Thi công thô
              }}
              className="bg-white/5 hover:bg-white/10 text-left px-2.5 py-1.5 rounded transition-all flex items-center justify-between group cursor-pointer text-[#C4C0B8] hover:text-[#FAF8F4]"
            >
              <span>1. Quy trình &amp; Phạt trễ hạn</span>
              <ChevronRight size={10} className="text-[#B8913A] group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => {
                document.getElementById('section-3')?.scrollIntoView({ behavior: 'smooth' });
                setActiveTab('CHECKLIST');
              }}
              className="bg-white/5 hover:bg-white/10 text-left px-2.5 py-1.5 rounded transition-all flex items-center justify-between group cursor-pointer text-[#C4C0B8] hover:text-[#FAF8F4]"
            >
              <span>2. Nghiệm thu 120 điểm gỗ</span>
              <ChevronRight size={10} className="text-[#B8913A] group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => {
                document.getElementById('section-4')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/5 hover:bg-white/10 text-left px-2.5 py-1.5 rounded transition-all flex items-center justify-between group cursor-pointer text-[#C4C0B8] hover:text-[#FAF8F4]"
            >
              <span>3. Minh bạch BOQ &amp; Chi phí</span>
              <ChevronRight size={10} className="text-[#B8913A] group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => {
                document.getElementById('section-5')?.scrollIntoView({ behavior: 'smooth' });
                setActiveDiaryTab('DIARY');
              }}
              className="bg-white/5 hover:bg-white/10 text-left px-2.5 py-1.5 rounded transition-all flex items-center justify-between group cursor-pointer text-[#C4C0B8] hover:text-[#FAF8F4]"
            >
              <span>4. Nhật ký chống thấm 72h</span>
              <ChevronRight size={10} className="text-[#B8913A] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ── SHARING MANAGER PANEL MODAL ── */}
      {isPreview && showShareManager && (
        <div className="fixed inset-0 bg-[#1A1814]/90 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowShareManager(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 text-2xl font-bold bg-stone-100 hover:bg-stone-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer"
            >
              &times;
            </button>
            <div className="p-2">
              <PortfolioManager />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const SIMULATED_TASKS = [
  { name: 'Móng & Khung bê tông kết cấu', progress: 100, status: 'Hoàn thành' },
  { name: 'Xây tường gạch & ME&P âm tường', progress: 100, status: 'Hoàn thành' },
  { name: 'Sản xuất đồ gỗ nội thất tại xưởng', progress: 100, status: 'Hoàn thành' },
  { name: 'Lắp ráp đồ gỗ & Hoàn thiện hiện trường', progress: 75, status: 'Đang thi công' },
  { name: 'Vệ sinh công nghiệp & Nghiệm thu bàn giao', progress: 0, status: 'Chuẩn bị' }
];
