import { useState } from 'react';
import { motion } from 'motion/react';
import { X, ChevronRight, ArrowLeft, MapPin } from 'lucide-react';

export interface DefectCategory {
  id: string;
  label: string;
  icon: string;
  planType: string; // maps to FloorPlan.planType
  subcategories: string[];
}

export const DEFECT_CATEGORIES: DefectCategory[] = [
  {
    id: 'perspective',
    label: 'Phối cảnh',
    icon: '🖼️',
    planType: 'perspective',
    subcategories: ['Sai màu sắc', 'Sai vật liệu', 'Không giống 3D', 'Khác']
  },
  {
    id: 'material_spec',
    label: 'Vật liệu',
    icon: '🪨',
    planType: 'material_spec',
    subcategories: ['Sai mẫu', 'Chất lượng kém', 'Thiếu hụt', 'Khác']
  },
  {
    id: 'equipment',
    label: 'Thiết bị',
    icon: '⚙️',
    planType: 'equipment',
    subcategories: ['Lỗi kỹ thuật', 'Thiếu phụ kiện', 'Sai mã', 'Khuyết tật', 'Khác']
  },
  {
    id: 'finishing',
    label: 'Hoàn thiện',
    icon: '🎨',
    planType: 'rough_construction',
    subcategories: ['Ốp lát', 'Trần thạch cao', 'Đèn/Chiếu sáng', 'Sơn bả', 'Chống thấm', 'Silicone', 'Khác']
  },
  {
    id: 'interior',
    label: 'Nội thất',
    icon: '🪑',
    planType: 'interior_detail',
    subcategories: ['Bố trí', 'Vách', 'Tủ', 'Sàn gỗ', 'Cửa', 'Kính', 'Rèm', 'Nệm/Ghế', 'Khác']
  },
  {
    id: 'kc_mep',
    label: 'KC-MEP',
    icon: '🏗️',
    planType: 'kc_me',
    subcategories: ['Móng', 'Dầm/Cột', 'Sàn/Tường xây', 'Điện', 'Nước', 'Điều hòa', 'PCCC', 'Khác']
  }
];

interface DefectCategorySelectorProps {
  onSelect: (category: DefectCategory, subcategory: string) => void;
  onClose: () => void;
}

export default function DefectCategorySelector({ onSelect, onClose }: DefectCategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<DefectCategory | null>(null);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#0f1222] border border-indigo-500/30 text-slate-100 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#151930] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {selectedCategory ? (
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-1 hover:bg-slate-800 rounded-full text-indigo-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <MapPin className="w-5 h-5 text-indigo-400" />
            )}
            <h3 className="font-black text-slate-100 text-sm tracking-wide uppercase">
              {selectedCategory ? selectedCategory.label : 'Hạng mục lỗi'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2 overflow-y-auto">
          {!selectedCategory ? (
            <>
              <p className="text-xs text-slate-400 font-medium px-1 mb-1">
                Chọn hạng mục để phân loại và tự động mở đúng bản vẽ
              </p>
              {DEFECT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl shrink-0">
                      {cat.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-200">{cat.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {cat.subcategories.filter(s => s !== 'Khác').slice(0, 4).join(' · ')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400 font-medium px-1 mb-1">
                {selectedCategory.icon} {selectedCategory.label} — Chọn chi tiết:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {selectedCategory.subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => onSelect(selectedCategory, sub)}
                    className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 transition-all text-left active:scale-[0.96] group"
                  >
                    <span className="font-bold text-sm text-slate-200 group-hover:text-indigo-300">{sub}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
