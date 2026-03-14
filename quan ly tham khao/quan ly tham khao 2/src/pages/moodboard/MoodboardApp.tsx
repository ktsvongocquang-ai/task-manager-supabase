import React from 'react';
import { 
  LayoutTemplate, 
  MousePointer2, 
  ImageIcon, 
  Circle, 
  Square, 
  Type, 
  Lightbulb, 
  Box, 
  Palette, 
  Camera, 
  ChevronRight 
} from 'lucide-react';

export default function MoodboardApp() {
  return (
    <div className="flex flex-col h-full bg-[#0A0A0F]">
      <div className="p-4 flex items-center justify-between bg-[#1C1C28] sticky top-0 z-10 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="w-6 h-6 text-rose-500" />
          <h1 className="text-xl font-bold text-white">Tạo Moodboard</h1>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Lưu
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Canvas Area */}
        <div className="flex-1 bg-white m-4 rounded-xl border border-gray-800 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
           {/* Mockup of canvas with some images and circles */}
           <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-2 border-indigo-500 overflow-hidden shadow-lg">
             <img src="https://picsum.photos/seed/wood/200/200" className="w-full h-full object-cover" alt="wood" referrerPolicy="no-referrer" />
           </div>
           <div className="absolute top-20 left-36 w-40 h-40 rounded-full border-2 border-emerald-500 overflow-hidden shadow-lg">
             <img src="https://picsum.photos/seed/interior/200/200" className="w-full h-full object-cover" alt="interior" referrerPolicy="no-referrer" />
           </div>
           <div className="absolute bottom-20 right-10 w-48 h-32 bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg p-2">
             <img src="https://picsum.photos/seed/furniture/300/200" className="w-full h-full object-cover rounded" alt="furniture" referrerPolicy="no-referrer" />
           </div>
           
           {/* Toolbar */}
           <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#1C1C28] border border-gray-800 rounded-xl p-2 flex flex-col gap-2 shadow-xl">
             <button className="p-2 text-white bg-indigo-600 rounded-lg"><MousePointer2 className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><ImageIcon className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Circle className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Square className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Type className="w-5 h-5" /></button>
           </div>
        </div>

        {/* Bottom Process Bar (like in the video) */}
        <div className="bg-[#1C1C28] border-t border-gray-800 p-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max px-2">
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Ý TƯỞNG
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Box className="w-4 h-4" /> BỐI CẢNH
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Palette className="w-4 h-4" /> PHONG CÁCH
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Camera className="w-4 h-4" /> GÓC NHÌN
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> MOODBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
