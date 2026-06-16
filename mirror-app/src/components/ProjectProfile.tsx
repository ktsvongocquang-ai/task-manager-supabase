import { useState, useMemo, useEffect, useRef } from 'react';
import { Project, FloorPlan, MarkerNote } from '../types';
import { Grid, Image as ImageIcon, Box, CheckCircle2, ChevronRight, Upload, FileText, ClipboardList, Circle, Camera, Target, Trash2 } from 'lucide-react';
import PinMapPreview from './PinMapPreview';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import FileUploader from './FileUploader';
import ReportLayout from './ReportLayout';
import NotificationPanel from './NotificationPanel';

let savedProjectScrollTop = 0;
let savedActiveTab: 'design' | 'construction' = 'design';
let savedConstructionTab: 'issues' | 'diary' = 'issues';
let savedSelectedFilter: string | null = null;

interface ProjectProfileProps {
  project: Project | null;
  floorPlans: FloorPlan[];
  markers: MarkerNote[];
  onUploadFile: (planType: FloorPlan['planType']) => void;
  onOpenPinMap?: (planId: string, markerId?: string) => void;
  onQuickCapture?: () => void;
  onTogglePinTarget?: (planId: string, isPinTarget: boolean) => void;
  onDeleteFloorPlan?: (planId: string) => void;
}

const DOC_CATEGORIES = [
  { type: 'perspective',        label: 'File Phối Cảnh',            shortLabel: 'Phối cảnh',       icon: CheckCircle2, color: 'text-indigo-500 border-indigo-200' },
  { type: 'material_equipment', label: 'Vật Liệu & Thiết Bị',      shortLabel: 'VL & TB',         icon: CheckCircle2, color: 'text-amber-500 border-amber-200'  },
  { type: 'rough_construction', label: 'Triển Khai Hoàn Thiện',     shortLabel: 'Hoàn thiện',      icon: CheckCircle2, color: 'text-slate-500 border-slate-200'  },
  { type: 'interior_detail',    label: 'Triển Khai Nội Thất',       shortLabel: 'Nội thất',        icon: CheckCircle2, color: 'text-emerald-500 border-emerald-200' },
  { type: 'structure',          label: 'Bản Vẽ Kết Cấu',           shortLabel: 'Kết cấu',         icon: CheckCircle2, color: 'text-rose-500 border-rose-200'   },
  { type: 'mep',                label: 'Bản Vẽ MEP',               shortLabel: 'MEP',             icon: CheckCircle2, color: 'text-cyan-500 border-cyan-200'   },
] as const;

export default function ProjectProfile({ project, floorPlans, markers, onUploadFile, onOpenPinMap, onQuickCapture, onTogglePinTarget, onDeleteFloorPlan }: ProjectProfileProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'construction'>(savedActiveTab);
  const [constructionTab, setConstructionTab] = useState<'issues' | 'diary'>(savedConstructionTab);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(savedSelectedFilter);

  useEffect(() => { savedActiveTab = activeTab; }, [activeTab]);
  useEffect(() => { savedConstructionTab = constructionTab; }, [constructionTab]);
  useEffect(() => { savedSelectedFilter = selectedFilter; }, [selectedFilter]);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = savedProjectScrollTop;
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      savedProjectScrollTop = scrollRef.current.scrollTop;
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-8 bg-slate-50">
        Chưa chọn dự án
      </div>
    );
  }

  // Calculate Progress (mock logic based on uploaded categories)
  const STANDARD_TYPES = new Set(DOC_CATEGORIES.map(c => c.type));
  const uploadedTypes = new Set(
    floorPlans
      .filter(fp => fp.projectId === project.id && STANDARD_TYPES.has(fp.planType as string))
      .map(fp => fp.planType)
  );
  const computedProgress = Math.round((uploadedTypes.size / DOC_CATEGORIES.length) * 100) || 83; // fallback to 83 for UI demo

  // Filter plans based on selected chip
  const filteredPlans = useMemo(() => {
    let plans = floorPlans.filter(fp => fp.projectId === project.id);
    if (selectedFilter) {
      plans = plans.filter(fp => fp.planType === selectedFilter);
    }
    return plans;
  }, [floorPlans, project.id, selectedFilter]);

  // Group plans by category to count
  const groupedCount = DOC_CATEGORIES.map(cat => ({
    ...cat,
    count: floorPlans.filter(fp => fp.projectId === project.id && fp.planType === cat.type).length
  }));

  const activeCategoryName = selectedFilter 
    ? DOC_CATEGORIES.find(c => c.type === selectedFilter)?.label 
    : 'Tất cả file';

  const activeMarkers = activeTab === 'design' ? markers : [];
  const activeProgress = activeTab === 'design' ? computedProgress : 0;

  return (
    <div 
      ref={scrollRef} 
      onScroll={handleScroll}
      className="flex-1 bg-white text-slate-900 overflow-y-auto pb-24 custom-scrollbar"
    >
      
      {/* Compact Top Header */}
      <div className="px-6 pt-6 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
            <Grid size={20} className="text-slate-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">{project.name}</h1>
            <p className="text-[12px] text-slate-500 font-medium tracking-wide">Cải tạo · Giai đoạn Hoàn thiện</p>
          </div>
        </div>
        <NotificationPanel currentProjectName={project?.name} />
      </div>

      {/* Segmented Control */}
      <div className="px-6 mb-8">
        <div className="flex p-1 bg-slate-100 rounded-full border border-slate-200 shadow-inner">
          <button 
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-2.5 text-[13px] font-bold rounded-full transition-all ${activeTab === 'design' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Hồ sơ thiết kế
          </button>
          <button 
            onClick={() => setActiveTab('construction')}
            className={`flex-1 py-2.5 text-[13px] font-bold rounded-full transition-all ${activeTab === 'construction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Thi công
          </button>
        </div>
      </div>

      {activeTab === 'design' && (
        <div className="flex flex-col gap-6">
          {/* Progress & Filters Card */}
          <div className="px-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] text-slate-600 font-bold">Tiến độ hồ sơ</span>
                <span className="text-lg font-black text-slate-900 leading-none">{computedProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-out" style={{ width: `${computedProgress}%` }} />
              </div>
              
              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2 pb-1">
                {DOC_CATEGORIES.map(cat => {
                  const hasPinnedPlan = floorPlans.some(fp => fp.projectId === project.id && fp.planType === cat.type && fp.isPinTarget);
                  const Icon = hasPinnedPlan ? CheckCircle2 : Circle;
                  
                  return (
                    <button 
                      key={cat.type}
                      onClick={() => setSelectedFilter(selectedFilter === cat.type ? null : cat.type)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-bold whitespace-nowrap transition-all shrink-0 ${selectedFilter === cat.type ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50'}`}
                    >
                      <Icon size={14} className={selectedFilter === cat.type ? 'text-white' : (hasPinnedPlan ? 'text-emerald-500' : 'text-slate-400')} />
                      {cat.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-6 mb-2">
            <h3 className="text-[13px] font-black text-slate-500 tracking-wider uppercase">Hồ sơ tài liệu chuẩn mực</h3>
          </div>

          {/* File Groups */}
          <div className="px-6 flex flex-col gap-8 pb-10">
            {(selectedFilter ? DOC_CATEGORIES.filter(c => c.type === selectedFilter) : DOC_CATEGORIES).map(cat => {
              const plansInCat = floorPlans.filter(fp => fp.projectId === project.id && fp.planType === cat.type);
              if (plansInCat.length === 0 && selectedFilter !== cat.type) return null;
              
              const CatIcon = cat.icon || ImageIcon;
              
              return (
                <div key={cat.type} className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Group Header */}
                  <div className="px-5 py-4 border-b border-indigo-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={18} className="text-indigo-600" />
                      <h3 className="text-[14px] font-black text-indigo-700 tracking-wide uppercase">{cat.label}</h3>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{plansInCat.length} file</span>
                  </div>

                  {/* Grid of Files */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">
                    {plansInCat.map((plan, idx) => {
                      const status = idx === 0 ? 'approved' : idx === 1 ? 'rejected' : 'pending';
                      
                      return (
                        <div 
                          key={plan.id}
                          onClick={() => onOpenPinMap?.(plan.id)}
                          className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col group"
                        >
                          {/* Image Container with Badges */}
                          <div className="relative aspect-[4/3] bg-slate-100 border-b border-slate-100 overflow-hidden">
                            {plan.imageData ? (
                              <img src={plan.imageData} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CatIcon size={32} className="text-slate-300" />
                              </div>
                            )}
                            {/* Badges */}
                            <div className="absolute top-2 left-2">
                              <div className="px-2.5 py-1 bg-[#1A1A1A]/90 backdrop-blur-sm text-white text-[12px] font-bold rounded-lg shadow-sm">
                                v1.0
                              </div>
                            </div>
                            
                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                              {onDeleteFloorPlan && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteFloorPlan(plan.id); }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1A1A1A]/70 text-slate-300 hover:text-rose-400 hover:bg-[#1A1A1A]/90 transition-all backdrop-blur-sm shadow-sm"
                                  title="Xóa bản vẽ"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                              {onTogglePinTarget && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onTogglePinTarget(plan.id, !plan.isPinTarget); }}
                                  className={`px-2.5 py-1 text-[12px] font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all backdrop-blur-sm ${
                                    plan.isPinTarget 
                                      ? 'bg-emerald-500/90 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-emerald-600/90' 
                                      : 'bg-[#1A1A1A]/70 text-white hover:bg-[#1A1A1A]/90'
                                  }`}
                                >
                                  <Target size={12} />
                                  {plan.isPinTarget ? 'Đã ghim' : 'Chọn ghim'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Text Content */}
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <h4 className="text-[14px] font-bold text-slate-900 truncate mb-1" title={plan.name}>{plan.name}</h4>
                            <p className="text-[11px] text-slate-500 truncate" title={`Cập nhật bản vẽ: ${plan.name}`}>Cập nhật bản vẽ: {plan.name}</p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Add More Card */}
                    <div 
                      onClick={() => onUploadFile(cat.type)}
                      className="aspect-[4/3] rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm">
                        +
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 tracking-wide uppercase">Tải thêm</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'construction' && (
        <div className="flex flex-col gap-6">
          {/* Progress & Summary Card */}
          <div className="px-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] text-slate-600 font-bold">Tiến độ thi công</span>
                <span className="text-lg font-black text-slate-900 leading-none">71%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-out" style={{ width: '71%' }} />
              </div>
              
              <div className="flex justify-around items-center border-t border-slate-100 pt-5">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-800">{markers.length}</span>
                  <span className="text-[11px] font-bold text-slate-500 mt-1">Tổng sự cố</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-amber-500">{markers.filter(m => m.status === 'in_progress' || m.status === 'pending').length}</span>
                  <span className="text-[11px] font-bold text-slate-500 mt-1">Đang sửa</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-emerald-500">{markers.filter(m => m.status === 'resolved').length}</span>
                  <span className="text-[11px] font-bold text-slate-500 mt-1">Đã xong</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tabs for construction module */}
          <div className="px-6">
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button 
                onClick={() => setConstructionTab('issues')}
                className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${constructionTab === 'issues' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dàn lỗi ({markers.length})
              </button>
              <button 
                onClick={() => setConstructionTab('diary')}
                className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${constructionTab === 'diary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Nhật ký
              </button>
            </div>
          </div>

          {/* Issues List */}
          {constructionTab === 'issues' && (
            <div className="px-0 sm:px-6 mb-8 mt-4">
              <div className="rounded-2xl border border-[#333] shadow-sm max-h-[75vh] flex flex-col relative overflow-hidden bg-white">
                <ReportLayout 
                  project={project} 
                  floorPlans={floorPlans} 
                  markers={markers} 
                  onNavigateToPin={(fpId, mId) => {
                    if (fpId && onOpenPinMap) onOpenPinMap(fpId, mId);
                  }}
                />
              </div>
            </div>
          )}

          {/* Construction Diary */}
          {constructionTab === 'diary' && (
          <div className="px-6 mb-8">
            <h3 className="text-[13px] font-black text-slate-500 tracking-wider mb-4">Nhật ký thi công</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex flex-col items-center justify-center shrink-0 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 leading-none">TH 6</span>
                  <span className="text-[14px] font-black text-slate-800 leading-none mt-0.5">10</span>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <h4 className="text-[13px] font-bold text-slate-900 mb-1">Đổ bê tông sàn tầng 2</h4>
                  <p className="text-[12px] text-slate-600 mb-2">Đã hoàn tất nghiệm thu cốt thép và đổ bê tông 150m2 sàn. Chờ bảo dưỡng.</p>
                  <div className="flex gap-2">
                    <div className="w-14 h-14 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1541888087405-d61db19e6a11?w=100&h=100&fit=crop" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-14 h-14 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=100&h=100&fit=crop" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex flex-col items-center justify-center shrink-0 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 leading-none">TH 6</span>
                  <span className="text-[14px] font-black text-slate-800 leading-none mt-0.5">08</span>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <h4 className="text-[13px] font-bold text-slate-900 mb-1">Thi công ván khuôn móng</h4>
                  <p className="text-[12px] text-slate-600">Đã xong 80% ván khuôn móng, chuẩn bị nghiệm thu để đổ bê tông móng.</p>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl border border-dashed border-slate-300 text-[12px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                + Thêm nhật ký hôm nay
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Floating Action Button — chỉ hiện "Tải bản vẽ" ở tab Hồ sơ thiết kế */}
      {activeTab === 'design' && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
          {showUploadMenu && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 mb-2 w-56 flex flex-col gap-1 origin-bottom-right animate-in fade-in zoom-in duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Chọn thư mục tải lên</span>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {DOC_CATEGORIES.map(cat => (
                  <button 
                    key={cat.type}
                    onClick={() => {
                      onUploadFile(cat.type);
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-bold transition-colors"
                  >
                    {cat.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button 
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-[0_8px_16px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-transform"
          >
            <Upload size={16} strokeWidth={2.5} />
            <span className="text-xs">Tải bản vẽ</span>
          </button>
        </div>
      )}

    </div>
  );
}
