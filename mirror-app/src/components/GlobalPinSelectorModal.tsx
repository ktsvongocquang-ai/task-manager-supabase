import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map, Folder, ChevronRight, AlertCircle, MapPin } from 'lucide-react';
import { Project, FloorPlan } from '../types';

interface GlobalPinSelectorModalProps {
  projects: Project[];
  floorPlans: FloorPlan[];
  onSelectDestination: (projectId: string, floorPlanId: string) => void;
  onClose: () => void;
}

export default function GlobalPinSelectorModal({ projects, floorPlans, onSelectDestination, onClose }: GlobalPinSelectorModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeProjects = projects.filter(p => p.status === 'active');
  const projectPlans = selectedProjectId ? floorPlans.filter(p => p.projectId === selectedProjectId) : [];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f1222] border border-emerald-500/50 text-slate-100 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col max-h-[85vh]"
      >
        <div className="px-5 py-4 bg-[#151930] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-slate-100 text-sm tracking-wide uppercase">Chọn vị trí Ghim Lỗi</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {!selectedProjectId ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Đã lưu tạm lỗi. Bạn muốn ghim lỗi này vào Công trình nào?</span>
              </div>
              
              <span className="text-xs font-bold text-slate-400 uppercase mt-2">Danh sách công trình</span>
              <div className="flex flex-col gap-2">
                {activeProjects.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-200">{proj.name}</span>
                        <span className="text-[10px] text-slate-500">{proj.client}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                ))}
                {activeProjects.length === 0 && (
                  <div className="text-center p-5 text-slate-500 text-xs">Không có công trình nào đang hoạt động.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="self-start text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2"
              >
                ← Quay lại chọn công trình
              </button>
              
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Chọn 1 bản vẽ thuộc công trình này để mở ra và thả ghim!</span>
              </div>
              
              <span className="text-xs font-bold text-slate-400 uppercase mt-2">Bản vẽ & Mặt bằng</span>
              <div className="flex flex-col gap-2">
                {projectPlans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => onSelectDestination(selectedProjectId, plan.id)}
                    className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-800">
                      <img src={plan.imageData} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-sm text-slate-200 line-clamp-2">{plan.name}</span>
                      <span className="text-[10px] text-emerald-500 font-bold mt-1">MỞ BẢN VẼ →</span>
                    </div>
                  </button>
                ))}
                {projectPlans.length === 0 && (
                  <div className="text-center p-5 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                    Công trình này chưa có bản vẽ nào.<br/>
                    Vui lòng quay lại chọn công trình khác.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
