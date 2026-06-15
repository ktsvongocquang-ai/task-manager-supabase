
import { 
  LayoutTemplate, 
  MousePointer2, 
  Image as ImageIcon, 
  Circle, 
  Square, 
  Type, 
  Lightbulb, 
  Box, 
  Palette, 
  ChevronRight,
  Camera
} from 'lucide-react';

export const Moodboard = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white sticky top-0 z-10 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
             <LayoutTemplate className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tạo Moodboard</h1>
            <p className="text-xs text-slate-500 font-medium">Bảng ý tưởng thiết kế trực quan</p>
          </div>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto transition-colors shadow-sm text-white px-6 py-2 rounded-lg text-sm font-bold">
          Lưu Bảng
        </button>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50/50 p-4 relative overflow-hidden">
        {/* Toolbar - Floating */}
        <div className="absolute left-6 top-6 bg-white border border-slate-200 rounded-xl p-2 flex flex-col gap-2 shadow-lg z-20">
            <button className="p-2.5 text-indigo-600 bg-indigo-50 rounded-lg" title="Chọn"><MousePointer2 className="w-5 h-5" /></button>
            <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg" title="Thêm ảnh"><ImageIcon className="w-5 h-5" /></button>
            <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg" title="Hình tròn"><Circle className="w-5 h-5" /></button>
            <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg" title="Hình vuông"><Square className="w-5 h-5" /></button>
            <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg" title="Văn bản"><Type className="w-5 h-5" /></button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-300 shadow-inner relative overflow-hidden min-h-[400px]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
           {/* Mockup of canvas with some images and circles */}
           <div className="absolute top-10 left-[200px] w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-indigo-100 overflow-hidden shadow-xl transform rotate-[-5deg] hover:scale-105 transition-transform cursor-move">
             <img src="https://picsum.photos/seed/wood/300/300" className="w-full h-full object-cover" alt="wood" />
           </div>
           <div className="absolute top-20 left-[100px] md:left-[350px] w-32 h-32 md:w-64 md:h-64 rounded-full border-4 border-emerald-100 overflow-hidden shadow-xl transform rotate-[10deg] hover:scale-105 transition-transform cursor-move">
             <img src="https://picsum.photos/seed/interior/400/400" className="w-full h-full object-cover" alt="interior" />
           </div>
           <div className="absolute bottom-10 right-[20px] md:bottom-20 md:right-[100px] w-48 h-36 md:w-80 md:h-60 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl p-3 transform rotate-[-3deg] hover:scale-105 transition-transform cursor-move">
             <img src="https://picsum.photos/seed/furniture/400/300" className="w-full h-full object-cover rounded-lg" alt="furniture" />
             <div className="mt-2 text-center text-xs md:text-sm font-bold text-slate-700 font-serif italic">Góc sofa phòng khách</div>
           </div>
        </div>
      </div>

      {/* Bottom Process Bar */}
      <div className="bg-white border-t border-slate-200 p-3 overflow-x-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
        <div className="flex items-center justify-center gap-1 sm:gap-3 min-w-max px-2 max-w-4xl mx-auto">
          <button className="px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2 border border-slate-200">
            <Lightbulb className="w-4 h-4" /> Ý TƯỞNG
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <button className="px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2 border border-slate-200">
            <Box className="w-4 h-4" /> BỐI CẢNH
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <button className="px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2 border border-slate-200">
            <Palette className="w-4 h-4" /> PHONG CÁCH
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <button className="px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2 border border-slate-200">
            <Camera className="w-4 h-4" /> GÓC NHÌN
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <button className="px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-2 border border-indigo-700/50">
            <LayoutTemplate className="w-4 h-4" /> MOODBOARD
          </button>
        </div>
      </div>
    </div>
  );
};
