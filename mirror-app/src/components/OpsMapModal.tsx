import { useState, useEffect } from 'react';
import { 
  X, Database, Check, Copy, Code, FileText, Cloud, Sparkles, RefreshCw, AlertCircle, Key, Link2, Download, CloudUpload, Play, ExternalLink
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  getSupabaseClient, 
  syncLocalToSupabase, 
  pullFromSupabase, 
  SUPABASE_SQL_SETUP 
} from '../lib/supabaseClient';
import { 
  getFloorPlans, 
  getMarkerNotes, 
  getAnnotations, 
  saveFloorPlan, 
  saveMarkerNote, 
  saveAnnotation,
  getProjects,
  saveProject
} from '../lib/db';

interface OpsMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncReload?: () => void; // Trigger root component to reload state
}

export default function OpsMapModal({ isOpen, onClose, onSyncReload }: OpsMapModalProps) {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [anonKey, setAnonKey] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  
  // Syncing states
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'failed'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'sql'>('sync');

  // Load existing credentials on open
  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      if (config) {
        setSupabaseUrl(config.url);
        setAnonKey(config.anonKey);
        testConnection(config.url, config.anonKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function testConnection(urlStr?: string, keyStr?: string) {
    const activeUrl = urlStr !== undefined ? urlStr : supabaseUrl;
    const activeKey = keyStr !== undefined ? keyStr : anonKey;

    if (!activeUrl || !activeKey) {
      setIsConnected(false);
      return;
    }

    setIsTesting(true);
    try {
      // Lazy test client connection dynamically
      const trialClient = getSupabaseClient();
      if (trialClient) {
        // Query some system table schema or do simple task select
        const { error } = await trialClient.from('floor_plans').select('id').limit(1).maybeSingle();
        // If it throws e.g. "relation does not exist" but connects, it's connected (just need table setup)!
        if (error && error.code !== '42P01') {
          console.warn('Supabase ping warning:', error);
          setIsConnected(false);
        } else {
          setIsConnected(true);
        }
      } else {
        setIsConnected(false);
      }
    } catch (e) {
      console.error('Test connection error:', e);
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  }

  function handleSaveCredentials() {
    if (!supabaseUrl.trim() || !anonKey.trim()) {
      alert('Vui lòng điền đầy đủ Supabase URL và API Anon Key!');
      return;
    }
    saveSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: anonKey.trim()
    });
    testConnection(supabaseUrl.trim(), anonKey.trim());
    setSyncMessage('Đã cấu hình thông tin khóa Supabase thành công!');
  }

  function handleDisconnect() {
    saveSupabaseConfig(null);
    setSupabaseUrl('');
    setAnonKey('');
    setIsConnected(false);
    setSyncMessage('Đã đăng xuất & xóa lịch sử khóa kết nối Supabase.');
  }

  // Sync IndexedDB -> Supabase Cloud PostgreSQL
  async function handlePushToCloud() {
    setSyncStatus('syncing');
    setSyncMessage('Đang lấy dữ liệu từ trình duyệt local (IndexedDB)...');

    try {
      const projects = await getProjects();
      const plans = await getFloorPlans();
      const markers = await getMarkerNotes();
      const annots = await getAnnotations();

      setSyncMessage(`Tìm thấy ${projects.length} dự án, ${plans.length} bản vẽ, ${markers.length} ghim lỗi, và ${annots.length} nhãn dán. Đang đẩy lên Supabase Cloud...`);
      
      const res = await syncLocalToSupabase(projects, plans, markers, annots);
      if (res.success) {
        setSyncStatus('success');
        setSyncMessage(res.message);
      } else {
        setSyncStatus('failed');
        setSyncMessage(res.message);
      }
    } catch (e: any) {
      setSyncStatus('failed');
      setSyncMessage(`Lỗi bất ngờ khi đồng bộ: ${e.message || e}`);
    }
  }

  // Pull Supabase Cloud -> local IndexedDB with merge overwrites
  async function handlePullFromCloud() {
    if (!window.confirm('Hành động này sẽ tải toàn bộ sơ đồ/ghim lỗi trên cloud và ghi đè vào bộ nhớ local. Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Đang kết nối tải dữ liệu từ máy chủ Supabase...');

    try {
      const res = await pullFromSupabase();
      if (!res.success) {
        setSyncStatus('failed');
        setSyncMessage(res.message);
        return;
      }

      setSyncMessage('Đang ghi đè dữ liệu vào kho lưu trữ nội bộ IndexedDB...');
      
      // Save all pulled components
      for (const proj of res.projects) {
        await saveProject(proj);
      }
      for (const plan of res.plans) {
        await saveFloorPlan(plan);
      }
      for (const m of res.markers) {
        await saveMarkerNote(m);
      }
      for (const a of res.annots) {
        await saveAnnotation(a);
      }

      setSyncStatus('success');
      setSyncMessage(`Tải dữ liệu đám mây hoàn tất! Đã cập nhật ${res.projects.length} dự án, ${res.plans.length} bản vẽ, ${res.markers.length} ghim lỗi, và ${res.annots.length} nét vẽ whiteboard.`);

      // Notify parent to refresh state
      if (onSyncReload) {
        onSyncReload();
      }
    } catch (e: any) {
      setSyncStatus('failed');
      setSyncMessage(`Lỗi đồng bộ xuống: ${e.message || e}`);
    }
  }

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        id="ops-map-modal-card" 
        className="bg-slate-950 border border-slate-900 w-full max-w-4xl h-[90vh] md:h-[80vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-900 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                Cổng Đồng Bộ Đám Mây Mở Supabase DB
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full uppercase font-mono">Bản miễn phí</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Không cần mua bản quyền đắt đỏ! Đồng bộ hóa toàn bộ 10 dự án thiết kế, hàng trăm ghim kỹ thuật và nhãn ghi chú về database Supabase của riêng bạn.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-start gap-1 bg-slate-950 px-5 border-b border-slate-900 overflow-x-auto select-none shrink-0">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔌 Cấu hình & Đồng bộ
          </button>
          
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📝 1-Click Code SQL Khởi Tạo DB
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 text-slate-300">
          
          {activeTab === 'sync' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: Setup form and credentials */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="bg-slate-900/55 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-emerald-400" />
                    Tham số kết nối Supabase của bạn
                  </h4>
                  
                  <p className="text-[11px] text-slate-400 leading-relaxed -mt-1">
                    Hệ thống chạy ngoại tuyến tuyệt đối an toàn trên trình duyệt của bạn (IndexedDB). Khi bạn phát và cập nhật các khóa này, dữ liệu sẽ tự động có thể sao lưu tới máy chủ PostgreSQL đám mây không mất chi phí.
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold col-span-3 uppercase">Supabase Project URL</label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://your-project-id.supabase.co"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Supabase API Anon Key</label>
                    <input
                      type="password"
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsIn..."
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Saved indicators and Connection testing triggers */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Trạng thái:</span>
                      {isTesting ? (
                        <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra...
                        </span>
                      ) : isConnected ? (
                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          ● ĐÃ KẾT NỐI CLOUD
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-rose-500/10 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 text-rose-400">
                          ○ NGOẠI TUYẾN / LOCAL ONLY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isConnected && (
                        <button
                          onClick={handleDisconnect}
                          className="px-3 py-1.5 bg-slate-950 text-rose-400 border border-slate-800 hover:bg-slate-900 text-[10px] font-bold rounded-xl cursor-pointer transition-colors"
                        >
                          Ngắt kết nối
                        </button>
                      )}
                      <button
                        onClick={handleSaveCredentials}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
                      >
                        Lưu cấu hình
                      </button>
                    </div>
                  </div>
                </div>

                {/* DB Info Card */}
                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-white font-bold block mb-1">💡 Mẹo tiết kiệm chi phí bản quyền tối đa:</span>
                    Mức độ lưu trữ của 10 dự án xây dựng kèm hình ảnh base64/thuyết minh có thể lưu trực tiếp hoàn toàn miễn phí trên gói Free của Supabase vốn cho phép lên tới <strong className="text-amber-400">500MB Database (PostgreSQL)</strong>. Bạn hoàn toàn không cần trả bất cứ gói cước dịch vụ Pro hay bản quyền bản quyền ứng dụng nào thêm!
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Action synchronization controls */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-slate-900/55 border border-slate-900 rounded-2xl p-5 flex flex-col h-full gap-4">
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    Thao tác đồng bộ dữ liệu
                  </h4>

                  {!isConnected ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-900 min-h-[160px]">
                      <Database className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                        Cần liên kết lưu trữ **Supabase url & key** ở khung bên trái trước khi bạn có thể bắn đẩy đồng bộ dữ liệu lên đám mây.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-3.5 justify-center">
                      
                      {/* Push action */}
                      <button
                        onClick={handlePushToCloud}
                        disabled={syncStatus === 'syncing'}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-350 p-4 rounded-2xl text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-md font-extrabold text-xs uppercase tracking-wide disabled:opacity-50 transition-all hover:scale-[1.01]"
                      >
                        <CloudUpload className="w-4 h-4 shrink-0" />
                        Đẩy dữ liệu lên Cloud Supabase (Push)
                      </button>

                      {/* Pull action */}
                      <button
                        onClick={handlePullFromCloud}
                        disabled={syncStatus === 'syncing'}
                        className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl text-white flex items-center justify-center gap-2 cursor-pointer font-bold text-xs uppercase tracking-wide disabled:opacity-50 transition-all hover:bg-slate-800"
                      >
                        <Download className="w-4 h-4 shrink-0 text-emerald-400" />
                        Tải dữ liệu từ Cloud về máy này (Pull)
                      </button>

                    </div>
                  )}

                  {/* Sync status logs console */}
                  <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl text-left">
                    <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Hộp ký hoạt động đồng bộ:</p>
                    <div className="mt-1.5 text-[10px] font-mono leading-relaxed h-[75px] overflow-y-auto text-slate-400">
                      {syncStatus === 'idle' && <span className="text-slate-500">○ Đang chờ lệnh từ KTS phụ trách...</span>}
                      {syncStatus === 'syncing' && <span className="text-amber-400 animate-pulse">● {syncMessage}</span>}
                      {syncStatus === 'success' && <span className="text-emerald-400">✔ Sẵn sàng! {syncMessage}</span>}
                      {syncStatus === 'failed' && <span className="text-rose-400">✖ Thất bại! {syncMessage}</span>}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === 'sql' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-white font-extrabold block">BƯỚC CHUẨN BỊ: KHỞI TẠO BẢNG CHỈ VỚI 1 LẦN DÁN</span>
                  Để việc đồng bộ và lưu trữ hoàn chỉnh không lỗi, bạn chỉ cần mở của sổ <strong className="text-emerald-400">SQL Editor</strong> trên bảng điều khiển Supabase của bạn, paste nguyên văn đoạn code bên dưới rồi nhấn <strong className="text-white">RUN (Chạy)</strong>. Quá trình mất 3 giây và hoàn tất cấu trúc vĩnh viễn!
                </div>
              </div>

              {/* Code display segment */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={copySqlToClipboard}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Đã copy!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Mã SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 pt-12 overflow-x-auto text-[10.5px] font-mono text-emerald-400/90 leading-tight max-h-[350px] scrollbar-thin">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>

              {/* Instruction banner guide external link */}
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs">
                <span className="text-emerald-400 font-bold">Chưa tạo tài khoản Supabase? Miễn phí 100% vĩnh viễn:</span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-white bg-emerald-500 hover:bg-emerald-400 text-[10px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow"
                >
                  Truy cập Supabase.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
