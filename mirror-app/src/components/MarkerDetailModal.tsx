import React, { useRef, useState, useEffect } from 'react';
import { MarkerNote } from '../types';
import { X, Mic, Camera, Trash2 } from 'lucide-react';

interface MarkerDetailModalProps {
  marker: MarkerNote;
  onUpdate: (id: string, updates: Partial<MarkerNote>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onTriggerCamera?: (markerId: string) => void;
}

export const MarkerDetailModal: React.FC<MarkerDetailModalProps> = ({
  marker,
  onUpdate,
  onDelete,
  onClose,
  onTriggerCamera
}) => {
  const [title, setTitle] = useState(marker.title || '');
  const [description, setDescription] = useState(marker.textNotes || '');
  const [status, setStatus] = useState(marker.tags?.[0] || 'Chưa sửa');
  const [severity, setSeverity] = useState(marker.severity || 'medium');
  const [assignee, setAssignee] = useState(marker.assignee || '');

  // Keep internal state synced when marker changes
  useEffect(() => {
    setTitle(marker.title || '');
    setDescription(marker.textNotes || '');
    setStatus(marker.tags?.[0] || 'Chưa sửa');
    setSeverity(marker.severity || 'medium');
    setAssignee(marker.assignee || '');
  }, [marker]);

  const handleSave = () => {
    onUpdate(marker.id, {
      title,
      textNotes: description,
      tags: [status],
      severity,
      assignee
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col border border-[#3a3a3a] overflow-hidden transform transition-all animate-fade-in">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#3a3a3a]">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chi tiết lỗi</p>
            <h2 className="text-xl font-bold text-white mt-0.5">Lỗi #{marker.id.substring(marker.id.length - 4)}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* Tiêu đề lỗi */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Tiêu đề lỗi *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Vd: Sai số tài khoản..."
              className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex gap-4">
            {/* Trạng thái */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
              >
                <option value="Chưa sửa">Chưa sửa</option>
                <option value="Đang sửa">Đang sửa</option>
                <option value="Đã sửa">Đã sửa</option>
              </select>
            </div>

            {/* Mức độ */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Mức độ
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
              >
                <option value="critical">Nghiêm trọng</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>
          </div>

          {/* Người chịu trách nhiệm */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Người chịu trách nhiệm
            </label>
            <input
              type="text"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              placeholder="Vd: Đội giám sát (Minh)"
              className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Chi tiết & Giao sửa */}
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Chi tiết & Giao sửa
              </label>
              <button className="flex items-center gap-1 text-[10px] font-medium text-indigo-400 hover:text-indigo-300">
                <Mic size={12} /> Đọc lỗi
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết..."
              rows={3}
              className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
            {marker.transcription && (
              <div className="mt-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <p className="text-[11px] italic text-indigo-200">"{marker.transcription}"</p>
              </div>
            )}
          </div>

          {/* Camera Button */}
          <button
            onClick={() => onTriggerCamera?.(marker.id)}
            className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-[#555] rounded-xl text-gray-300 hover:text-white hover:border-gray-400 transition-colors bg-[#1c1c1c]/50"
          >
            <Camera size={16} />
            <span className="text-sm font-medium">Chụp / Thêm ảnh hiện trạng</span>
          </button>
          
          {/* Display existing photos */}
          {marker.photoData && (
             <div className="mt-2">
               {/* Handles both array of urls and legacy single url */}
               {(() => {
                 let urls: string[] = [];
                 try {
                   const parsed = JSON.parse(marker.photoData);
                   urls = Array.isArray(parsed) ? parsed : [marker.photoData];
                 } catch {
                   urls = [marker.photoData];
                 }
                 return urls.length > 1 ? (
                   <div className="flex gap-2 overflow-x-auto no-scrollbar">
                     {urls.map((url: string, i: number) => (
                       <img key={i} src={url} alt={`Photo ${i}`} className="h-20 w-auto rounded-lg object-cover border border-[#444]" referrerPolicy="no-referrer" />
                     ))}
                   </div>
                 ) : (
                   <img src={urls[0]} alt="Photo" className="h-20 w-auto rounded-lg object-cover border border-[#444]" referrerPolicy="no-referrer" />
                 );
               })()}
             </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#3a3a3a] flex items-center justify-between bg-[#232323]">
          <button 
            onClick={() => onDelete(marker.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Gỡ pin
          </button>
          
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-white hover:bg-gray-200 text-black rounded-full text-sm font-bold shadow-lg transition-all active:scale-95"
          >
            Xong & đóng
          </button>
        </div>

      </div>
    </div>
  );
};
