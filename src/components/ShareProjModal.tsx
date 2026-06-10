import { useState, ChangeEvent } from 'react';
import { 
  X, Copy, Check, Share2, Globe, Users, FileJson, Upload, 
  CheckCircle, ArrowRight, ShieldCheck, Mail, ClipboardCopy
} from 'lucide-react';
import { FloorPlan, MarkerNote, WhiteboardAnnotation } from '../types/floorplan';

interface ShareProjModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: FloorPlan | null;
  markerNotes: MarkerNote[];
  annotations: WhiteboardAnnotation[];
  onImportSuccess: (importedPlan: FloorPlan, markers: MarkerNote[], annotations: WhiteboardAnnotation[]) => void;
}

export default function ShareProjModal({ 
  isOpen, 
  onClose, 
  activePlan, 
  markerNotes, 
  annotations,
  onImportSuccess
}: ShareProjModalProps) {
  const [copiedLink, setCopiedLink] = useState<'share' | 'dev' | 'message' | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Dynamically resolve application links
  const shareUri = "https://ais-pre-e3ftibxokzgpvshmtz2h3g-641426335466.asia-east1.run.app";
  const devUri = window.location.origin;

  const copyText = (text: string, type: 'share' | 'dev' | 'message') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const projectMessageTemplate = activePlan 
    ? `Kính gửi Quý khách hàng & Đối tác,

Dưới đây là thông tin và liên kết truy cập Bản vẽ nghiệm thu mặt bằng & sơ đồ hiện trường tương tác (Site Board) cho dự án: 
👉 Tên Bản Vẽ: "${activePlan.name}"
👉 Số điểm ghim sự cố hiện trường: ${markerNotes.length} ghim lỗi
👉 Nét vẽ & nhãn dán ghi chú: ${annotations.length} hình vẽ

Bạn có thể bấm vào liên kết dưới đây để xem trực tiếp, viết phản hồi, hoặc tải xuống báo cáo thi công:
🔗 Liên kết xem trực tuyến: ${shareUri}

Đơn vị thực hiện: DQH Architects & Nghiệm Thu Hiện Trường.`
    : '';

  // Handle importing a backup package
  const handleJsonImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Assert schema validity
        if (!json.floorPlan || !Array.isArray(json.markers) || !Array.isArray(json.annotations)) {
          throw new Error("Tệp sao lưu không đúng định dạng. Cần chứa bản vẽ, markers, và annotations!");
        }

        // Trigger parent callback to save in IndexedDB
        onImportSuccess(json.floorPlan, json.markers, json.annotations);
        alert(`Nhập gói khảo sát thành công! Đã tải lên bản vẽ "${json.floorPlan.name}" cùng với ${json.markers.length} điểm ghim dán lỗi.`);
        onClose();
      } catch (err: any) {
        setImportError(err.message || "Không thể đọc tệp sao lưu JSON này.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        id="share-proj-modal-card" 
        className="bg-slate-950 border border-slate-900 w-full max-w-2xl rounded-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/15 rounded-xl text-indigo-400 border border-indigo-505/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Chia Sẻ & Nhập Dữ Liệu Khảo Sát</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Cung cấp quyền truy cập bản vẽ nghiệm thu cho khách thầu phụ hoặc chủ nhà</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content scroll region */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          
          {/* Quick Notice Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-250 uppercase">Ứng dụng Tương Tác Nhóm Live Link</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Khi chia sẻ link, đối tác của bạn có thể trực tiếp vẽ whiteboard, thảo luận và in báo cáo. Đồng thời bạn có thể xuất/nhập file sao lưu toàn vẹn <span className="text-emerald-400 font-semibold font-mono">.json</span> để truyền tải dữ liệu offline cực nhanh.
              </p>
            </div>
          </div>

          {/* Sharing URLs Options */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              1. Liên Kết Chia Sẻ Trực Tuyến
            </label>

            <div className="flex flex-col gap-2 bg-slate-900/60 p-4.5 rounded-2xl border border-slate-900">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-200">Trang Hiển Thị Demo & Shared cho Đối Tác/Khách Hàng:</span>
                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 rounded uppercase font-bold">Public URL</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUri} 
                  className="bg-slate-950 border border-slate-900 text-xs font-mono text-indigo-300 p-2.5 rounded-xl flex-1 select-all outline-none"
                />
                <button
                  onClick={() => copyText(shareUri, 'share')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedLink === 'share' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink === 'share' ? 'Đã copy' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Copy Message Template for Zalo / Viber / Email */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase text-pink-400 tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              2. Soạn Sẵn Tin Nhắn Gửi Khách Hàng / Đối Tác
            </label>

            <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-900 flex flex-col gap-3">
              <p className="text-[10px] text-slate-400 leading-normal">
                Tin nhắn mẫu lịch sự chứa đầy đủ số liệu lỗi nghiệm thu hiện trường và link để gửi qua <span className="font-bold text-slate-200">Zalo, Telegram, Viber hoặc Email</span>:
              </p>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 max-h-36 overflow-y-auto select-text">
                <pre className="text-[10px] font-sans text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {projectMessageTemplate}
                </pre>
              </div>

              <button
                onClick={() => copyText(projectMessageTemplate, 'message')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {copiedLink === 'message' ? <Check className="w-4 h-4 text-emerald-400" /> : <ClipboardCopy className="w-4 h-4 text-indigo-400" />}
                <span>{copiedLink === 'message' ? 'Đã copy tin nhắn mẫu!' : 'Sao Chép Mẫu Tin Nhắn Làm Việc'}</span>
              </button>
            </div>
          </div>

          {/* Import / Synced Collaboration via JSON */}
          <div className="flex flex-col gap-3 border-t border-slate-900 pt-5">
            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5" />
              3. Nhập Gói Dữ Liệu Tương Tác (.JSON) Từ Khách Hàng/Đối Tác
            </label>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-900 flex flex-col items-center justify-center text-center gap-3">
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                Nếu khách hàng hoặc thầu phụ phụ trách gửi lại file sao lưu có ghi chú và tọa độ của họ, hãy tải lên đây để tích hợp trực tiếp vào thiết bị của bạn.
              </p>

              <label className="mt-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-lg">
                <Upload className="w-4 h-4" />
                <span>Chọn File Sao Lưu (.json)</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleJsonImport} 
                  className="hidden" 
                  disabled={importing}
                />
              </label>

              {importError && (
                <p className="text-[10.5px] mt-1 text-rose-400 font-medium font-mono bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">{importError}</p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>DQH Architects Collaboration Portal</span>
          <span>Security & Integrity Verified</span>
        </div>
      </div>
    </div>
  );
}
