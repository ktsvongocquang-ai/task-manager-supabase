import { useState, useMemo } from 'react';
import { Project, FloorPlan, MarkerNote } from '../types';
import { Grid, Image as ImageIcon, Box, CheckCircle2, ChevronRight, Upload, Bell } from 'lucide-react';

interface ProjectProfileProps {
  project: Project | null;
  floorPlans: FloorPlan[];
  markers: MarkerNote[];
  onUploadFile: (planType: FloorPlan['planType']) => void;
  onOpenPinMap?: (planId: string) => void;
}

const DOC_CATEGORIES = [
  { type: 'perspective',        label: 'File Phối Cảnh',            shortLabel: 'Phối cảnh',   icon: ImageIcon },
  { type: 'material_spec',      label: 'File Spec Vật Liệu',        shortLabel: 'Vật liệu',    icon: Box  },
  { type: 'equipment',          label: 'File Thiết Bị',             shortLabel: 'Thiết bị',    icon: Box   },
  { type: 'interior_detail',    label: 'Triển Khai Nội Thất',       shortLabel: 'Nội thất',    icon: Grid    },
  { type: 'rough_construction', label: 'Triển Khai Thô Hoàn Thiện', shortLabel: 'Hoàn thiện',  icon: Box  },
  { type: 'kc_me',              label: 'Bản vẽ KC-MEP',             shortLabel: 'KC-MEP',      icon: Grid },
] as const;

export default function ProjectProfile({ project, floorPlans, onUploadFile, onOpenPinMap }: ProjectProfileProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'construction'>('design');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-8 bg-[#1c1c1c]">
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

  return (
    <div className="flex-1 bg-[#1c1c1c] text-white overflow-y-auto pb-24 custom-scrollbar">
      
      {/* Top Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-[#1c1c1c]/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center border border-[#333]">
            <Grid size={20} className="text-gray-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white/95 leading-tight">{project.name}</h1>
            <p className="text-[11px] text-gray-400 font-medium tracking-wide">Cải tạo · Giai đoạn Hoàn thiện</p>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center bg-[#2a2a2a] rounded-full border border-[#333] hover:bg-[#333] transition-colors">
          <Bell size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Segmented Control */}
      <div className="px-4 mb-6">
        <div className="flex p-1 bg-[#2a2a2a] rounded-full border border-[#333]">
          <button 
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${activeTab === 'design' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Hồ sơ thiết kế
          </button>
          <button 
            onClick={() => setActiveTab('construction')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${activeTab === 'construction' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Thi công
          </button>
        </div>
      </div>

      {activeTab === 'design' && (
        <>
          {/* Progress Section */}
          <div className="px-4 mb-6">
            <div className="bg-[#232323] border border-[#333] rounded-2xl p-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-gray-400 font-medium">Tiến độ hồ sơ</span>
                <span className="text-lg font-bold text-white/95 leading-none">{computedProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: `${computedProgress}%` }} />
              </div>
              
              {/* Filter Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
                <button 
                  onClick={() => setSelectedFilter(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${!selectedFilter ? 'bg-[#3a3a3a] border-[#555] text-white' : 'border-[#333] text-gray-400 hover:text-gray-200 bg-[#2a2a2a]'}`}
                >
                  Tất cả
                </button>
                {groupedCount.map(cat => (
                  <button 
                    key={cat.type}
                    onClick={() => setSelectedFilter(cat.type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${selectedFilter === cat.type ? 'bg-[#3a3a3a] border-[#555] text-white' : 'border-[#333] text-gray-400 hover:text-gray-200 bg-[#2a2a2a]'}`}
                  >
                    <CheckCircle2 size={12} className={selectedFilter === cat.type ? 'text-white' : 'text-gray-500'} />
                    {cat.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="px-4">
            <h3 className="text-[12px] font-medium text-gray-400 mb-3 tracking-wide">{activeCategoryName} · {filteredPlans.length} file</h3>
            
            <div className="flex flex-col gap-3">
              {filteredPlans.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#333] rounded-2xl bg-[#232323]">
                  <p className="text-sm text-gray-500">Chưa có file nào trong mục này</p>
                </div>
              ) : (
                filteredPlans.map((plan, idx) => {
                  const CatIcon = DOC_CATEGORIES.find(c => c.type === plan.planType)?.icon || ImageIcon;
                  
                  // Mock status based on index for UI demonstration
                  const status = idx === 0 ? 'approved' : idx === 1 ? 'rejected' : 'pending';
                  
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => onOpenPinMap?.(plan.id)}
                      className="group flex items-center p-3 bg-[#232323] border border-[#333] rounded-2xl hover:bg-[#2a2a2a] hover:border-[#444] transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#2e2e2e] flex items-center justify-center shrink-0 mr-3 border border-[#3a3a3a]">
                        <CatIcon size={20} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-[13px] font-bold text-white/95 truncate">{plan.name}</h4>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{project.client} · Cập nhật gần đây</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        {status === 'approved' && (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px] font-bold tracking-wide">
                            Đã duyệt
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="px-2 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-[10px] font-bold tracking-wide">
                            Từ chối
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px] font-bold tracking-wide">
                            Chờ duyệt
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'construction' && (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          <p>Mô đun Thi công đang được cập nhật giao diện mới.</p>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => onUploadFile('perspective')}
        className="fixed bottom-20 right-4 flex items-center gap-2 px-4 py-3 bg-white text-black rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Upload size={16} strokeWidth={2.5} />
        <span className="text-xs">Tải bản vẽ</span>
      </button>

    </div>
  );
}
