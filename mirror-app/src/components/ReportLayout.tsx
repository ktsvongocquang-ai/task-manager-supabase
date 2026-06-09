import { Project, FloorPlan, MarkerNote } from '../types';
import { Camera, MapPin } from 'lucide-react';

const parseImages = (photoData: string | null): string[] => {
  if (!photoData) return [];
  try {
    const parsed = JSON.parse(photoData);
    if (Array.isArray(parsed)) return parsed;
    return [photoData];
  } catch {
    return [photoData];
  }
};

interface ReportLayoutProps {
  project: Project | null;
  floorPlans: FloorPlan[];
  markers: MarkerNote[];
  onNavigateToPin: (floorPlanId: string, markerId: string) => void;
}

export default function ReportLayout({ project, floorPlans, markers, onNavigateToPin }: ReportLayoutProps) {
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-8">
        Chưa chọn dự án
      </div>
    );
  }

  // Calculate defect stats
  const totalDefects = markers.length;
  const newDefects = markers.filter(m => !m.tags || !m.tags[0] || m.tags[0] === 'Chưa sửa').length;
  const fixingDefects = markers.filter(m => m.tags && m.tags[0] === 'Đang sửa').length;
  const doneDefects = markers.filter(m => m.tags && m.tags[0] === 'Đã duyệt').length;

  const stats = [
    { value: totalDefects, label: 'Tổng sự cố', color: 'text-slate-900', border: 'border-slate-200' },
    { value: newDefects, label: 'Mới phát hiện', color: 'text-red-600', border: 'border-red-200' },
    { value: fixingDefects, label: 'Đang sửa chữa', color: 'text-amber-600', border: 'border-amber-200' },
    { value: doneDefects, label: 'Đã xong xuôi', color: 'text-emerald-600', border: 'border-emerald-200' },
  ];

  const getStatusBadge = (marker: MarkerNote) => {
    const status = marker.tags && marker.tags[0] ? marker.tags[0] : 'Chưa sửa';
    const config: Record<string, { bg: string; text: string }> = {
      'Chưa sửa': { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
      'Đang sửa': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      'Đã duyệt': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    };
    const c = config[status] || config['Chưa sửa'];
    return (
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${c.bg} ${c.text}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 print:bg-white">
      <div className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none">

        {/* PAGE 1: Cover */}
        <div className="p-6 md:p-10 border-b border-slate-200">
          {/* Phase Badge */}
          <div className="inline-block bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded mb-4">
            Giai đoạn: Hoàn thiện
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-8">
            BÁO CÁO NHẬN DIỆN<br />
            SỰ CỐ THI CÔNG & LẮP ĐẶT
          </h1>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Dự án công trình</label>
              <p className="text-sm font-bold text-slate-900">{project.name}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Khách hàng / Đại diện</label>
              <p className="text-sm font-bold text-slate-900">{project.client}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Địa chỉ thi công</label>
              <p className="text-sm text-slate-700">{project.address}</p>
            </div>
            <div />
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Cán bộ giám sát lập hồ sơ</label>
              <p className="text-sm font-bold text-slate-900">{project.leader}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Ngày hoàn thiện tài liệu</label>
              <p className="text-sm text-slate-900">{new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="border border-slate-200 rounded-xl p-5">
            <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-500 text-center mb-4">
              Tóm tắt hiện trạng sự cố
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((s, i) => (
                <div key={i} className={`border ${s.border} rounded-lg p-3 text-center`}>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] text-slate-500 font-semibold mt-1 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Page footer */}
          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-6 pt-3 border-t border-slate-100">
            <span>Bản lập hồ sơ lên Site Board — Bản quyền KS. DQH Architects</span>
            <span>Trang 1 / {Math.ceil(markers.length / 2) + 1}</span>
          </div>
        </div>

        {/* PAGE 2+: Defect Details */}
        {markers.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Chưa có sự cố nào được ghim
          </div>
        ) : (
          markers.map((m, idx) => {
            const fp = floorPlans.find(p => p.id === m.floorPlanId);
            return (
              <div 
                key={m.id} 
                className="p-6 md:p-10 border-b border-slate-200 print:break-inside-avoid group cursor-pointer transition-all hover:bg-slate-50/50"
                onClick={() => onNavigateToPin(m.floorPlanId, m.id)}
                title="Bấm để xem vị trí trên bản đồ Pin"
              >
                {/* Defect Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Sự cố #{idx + 1}
                    </h2>
                    <p className="text-sm text-slate-600 mt-0.5">{m.title}</p>
                  </div>
                  {getStatusBadge(m)}
                </div>

                {/* 2-column: Photo + Floor Plan Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Site Photo */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Hình ảnh hiện trường</label>
                    {parseImages(m.photoData).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {parseImages(m.photoData).map((pUrl, pIdx) => (
                          <img
                            key={pIdx}
                            src={pUrl}
                            alt={`${m.title} - ảnh ${pIdx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Floor Plan with Pin Location */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Vị trí trên bản vẽ</label>
                    {fp ? (
                      <div className="relative w-full h-40 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                        <img
                          src={fp.imageData}
                          alt={fp.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        {/* Pin indicator */}
                        <div
                          className="absolute w-5 h-5 bg-red-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-[8px] font-black text-white transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${m.x}%`, top: `${m.y}%` }}
                        >
                          {idx + 1}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {(m.transcription || m.textNotes) && (
                  <div className="mb-3">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Mô tả chi tiết</label>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {m.transcription || m.textNotes}
                    </p>
                  </div>
                )}

                {/* Discussion summary */}
                {m.comments && m.comments.length > 0 && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Trao đổi ({m.comments.length})
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {m.comments.map(c => (
                        <div key={c.id} className="text-[11px] bg-slate-50 border border-slate-100 p-2 rounded-lg">
                          <span className="font-bold text-slate-800">{c.userName}</span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span className="text-slate-600">{c.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Concept image if any */}
                {m.conceptPhotoData && (
                  <div className="mt-3">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Ảnh concept đề xuất</label>
                    <img
                      src={m.conceptPhotoData}
                      alt="Concept"
                      className="w-full max-h-32 object-cover rounded-lg border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Final Page Footer */}
        <div className="p-6 md:p-10 flex items-center justify-between text-[9px] text-slate-400">
          <span>Bản lập hồ sơ lên Site Board — Bản quyền KS. DQH Architects</span>
          <span>Trang {Math.ceil(markers.length / 2) + 1} / {Math.ceil(markers.length / 2) + 1}</span>
        </div>
      </div>
    </div>
  );
}
