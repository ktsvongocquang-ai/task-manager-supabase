import React, { useState, useEffect } from 'react';
import { X, Phone, User, MapPin, Home, Briefcase, Maximize, DollarSign, Clock, Share2, FileText, Sparkles, Palette, CheckSquare, ListPlus, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: any) => void;
  initialData?: any;
}

const PROPERTY_TYPES = ['Căn hộ', 'Nhà phố', 'Biệt thự', 'Shophouse', 'Văn phòng'];
const SERVICE_CATEGORIES = ['Thiết kế', 'Thi công', 'Trọn gói'];
const BUDGET_RANGES = ['< 500tr', '500tr - 1 tỷ', '1 - 3 tỷ', '> 3 tỷ'];
const TIMINGS = ['Làm ngay', 'Tháng tới', 'Đang tham khảo'];
const LEAD_SOURCES = ['FB Ads', 'Google', 'Referral', 'TikTok'];
const STATUSES = ['Mới', 'Đang liên hệ', 'Đang tư vấn', 'Báo giá', 'Chốt', 'Mất'];

const STYLES = ['Chưa xác định', 'Hiện đại (Modern)', 'Tối giản (Minimalist)', 'Wabi Sabi', 'Indochine', 'Tân cổ điển', 'Luxury'];
const COLOR_TONES = ['Chưa xác định', 'Sáng (Trắng/Be)', 'Tối (Đen/Xám)', 'Trung tính', 'Màu ấm (Gỗ/Đất)', 'Màu lạnh'];
const KEY_CONCERNS = ['Chưa xác định', 'Ngân sách (Tối ưu)', 'Thiết kế có gu', 'Tiến độ nhanh', 'Chất lượng/Bền vững'];

const CHECKLIST_ITEMS = [
  { id: 'called', label: 'Đã gọi điện' },
  { id: 'sentInfo', label: 'Đã gửi thông tin' },
  { id: 'met', label: 'Đã hẹn gặp' },
  { id: 'quoted', label: 'Đã gửi báo giá' },
  { id: 'signed', label: 'Đã ký hợp đồng' }
];

// Phong thủy utility
function getFengShui(year: number): string {
  if (!year || year < 1900) return '';
  const canValues = [4, 4, 5, 5, 1, 1, 2, 2, 3, 3];
  const chiValues = [1, 1, 2, 2, 0, 0, 1, 1, 2, 2, 0, 0];
  const can = canValues[year % 10];
  const chi = chiValues[year % 12];
  let menhValue = can + chi;
  if (menhValue > 5) menhValue -= 5;
  const menhMap = ['Không rõ', 'Kim', 'Thủy', 'Hỏa', 'Thổ', 'Mộc'];
  return menhMap[menhValue];
}

export default function CustomerModal({ isOpen, onClose, onSave, initialData }: CustomerModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    namePhone: '',
    facebookUrl: '',
    birthYear: '',
    address: '',
    propertyType: 'Căn hộ',
    serviceCategory: 'Trọn gói',
    area: '',
    budget: '500tr - 1 tỷ',
    timing: 'Làm ngay',
    source: 'FB Ads',
    style: 'Chưa xác định',
    colorTone: 'Chưa xác định',
    keyConcern: 'Chưa xác định',
    notes: '',
    status: 'Mới',
    checklist: [] as string[],
    activityLog: [] as { date: string, content: string }[]
  });

  const [newLog, setNewLog] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...formData, 
        ...initialData,
        checklist: initialData.checklist || [],
        activityLog: initialData.activityLog || []
      });
    } else {
      setFormData({
        namePhone: '', facebookUrl: '', birthYear: '', address: '',
        propertyType: 'Căn hộ', serviceCategory: 'Trọn gói', area: '',
        budget: '500tr - 1 tỷ', timing: 'Làm ngay', source: 'FB Ads', 
        style: 'Chưa xác định', colorTone: 'Chưa xác định', keyConcern: 'Chưa xác định',
        notes: '', status: 'Mới', checklist: [], activityLog: []
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const year = parseInt(formData.birthYear);
  let generation = '';
  let careSuggestion = '';
  let fengShui = '';

  if (year && year >= 1900) {
    fengShui = getFengShui(year);
    if (year < 1980) {
      generation = 'Gen X';
      careSuggestion = 'Giao tiếp lịch sự, tập trung vào chất lượng vật liệu và bảo hành.';
    } else if (year >= 1981 && year <= 1996) {
      generation = 'Millennials';
      careSuggestion = 'Giao tiếp nhanh qua Zalo, tư vấn các giải pháp thông minh (Smart home).';
    } else {
      generation = 'Gen Z';
      careSuggestion = 'Giao tiếp cởi mở, tập trung vào Visual (ảnh đẹp), xu hướng mới nhất.';
    }
  }

  const handleAddLog = () => {
    if (!newLog.trim()) return;
    const logEntry = {
      date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      content: newLog.trim()
    };
    setFormData({
      ...formData,
      activityLog: [logEntry, ...formData.activityLog]
    });
    setNewLog('');
  };

  const toggleChecklist = (id: string) => {
    let newChecklist = [...formData.checklist];
    if (newChecklist.includes(id)) {
      newChecklist = newChecklist.filter(item => item !== id);
    } else {
      newChecklist.push(id);
    }
    
    // Auto update status based on checklist
    let newStatus = formData.status;
    if (newChecklist.includes('signed')) {
      newStatus = 'Chốt';
    } else if (newChecklist.includes('quoted')) {
      newStatus = 'Báo giá';
    } else if (newChecklist.includes('called') || newChecklist.includes('sentInfo') || newChecklist.includes('met')) {
      newStatus = 'Đang tư vấn';
    }

    setFormData({ ...formData, checklist: newChecklist, status: newStatus });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, generation, fengShui, careSuggestion });
    
    if (formData.status === 'Chốt' || formData.checklist.includes('signed')) {
      if (window.confirm('Khách hàng đã chốt hợp đồng! Bạn có muốn chuyển sang tab Quản lý Dự án ngay không?')) {
        navigate('/customers/projects', { state: { newProjectFromCustomer: { ...formData, generation, fengShui, careSuggestion } } });
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Cập nhật Khách hàng' : 'Thêm Khách hàng mới'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Hệ thống trường dữ liệu CRM Rút gọn (Mobile-First)</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="customer-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Auto-generated Insights Panel */}
            {year >= 1900 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-900">Gợi ý chăm sóc (AI Insights)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3 border border-white">
                    <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Hồ sơ khách hàng</div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">{generation}</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Mệnh {fengShui}</span>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-white">
                    <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Chiến lược tư vấn</div>
                    <div className="text-sm text-gray-800 font-medium leading-snug">
                      {careSuggestion}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left & Middle Columns: Main Info */}
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Column: Personal Info */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" /> Thông tin cá nhân
                    </h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">1. Họ tên & SĐT <span className="text-red-500">*</span></label>
                      <input required type="text" value={formData.namePhone} onChange={e => setFormData({...formData, namePhone: e.target.value})} placeholder="VD: Anh Tuấn 0909123456" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">2. Năm sinh</label>
                        <input type="number" value={formData.birthYear} onChange={e => setFormData({...formData, birthYear: e.target.value})} placeholder="VD: 1990" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">3. Link Facebook</label>
                        <input type="url" value={formData.facebookUrl} onChange={e => setFormData({...formData, facebookUrl: e.target.value})} placeholder="https://fb.com/..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">4. Địa chỉ / Tên dự án</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="VD: Quận 7 hoặc Vinhomes Grand Park" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>

                  {/* Right Column: Project Info */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <Home className="w-4 h-4 text-emerald-500" /> Nhu cầu dự án
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">5. Loại hình</label>
                        <select value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">6. Hạng mục</label>
                        <select value={formData.serviceCategory} onChange={e => setFormData({...formData, serviceCategory: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                          {SERVICE_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">7. Diện tích (m2)</label>
                        <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="VD: 120" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">8. Ngân sách</label>
                        <select value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                          {BUDGET_RANGES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">9. Thời điểm</label>
                        <select value={formData.timing} onChange={e => setFormData({...formData, timing: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                          {TIMINGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">10. Nguồn Lead</label>
                        <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                          {LEAD_SOURCES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Width: Design Direction */}
                <div className="space-y-4 bg-pink-50/50 p-5 rounded-xl border border-pink-100">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-pink-200 pb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-500" /> Định hướng thiết kế & Tư vấn
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">11. Style (Phong cách)</label>
                      <select value={formData.style} onChange={e => setFormData({...formData, style: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all">
                        {STYLES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">12. Tone màu chủ đạo</label>
                      <select value={formData.colorTone} onChange={e => setFormData({...formData, colorTone: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all">
                        {COLOR_TONES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">13. Mấu chốt quan tâm</label>
                      <select value={formData.keyConcern} onChange={e => setFormData({...formData, keyConcern: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all">
                        {KEY_CONCERNS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Full Width: Notes & Status */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" /> Thông tin bổ sung
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">14. Ghi chú nhanh (Pain points)</label>
                    <textarea 
                      value={formData.notes} 
                      onChange={e => setFormData({...formData, notes: e.target.value})} 
                      placeholder="VD: Ghét màu tối, ưu tiên bếp rộng, nhà có người già..." 
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Trạng thái (Status)</label>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormData({...formData, status})}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            formData.status === status 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Pipeline & Activity Log */}
              <div className="space-y-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                
                {/* Checklist */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-500" /> Tiến trình tư vấn
                  </h3>
                  <div className="space-y-2">
                    {CHECKLIST_ITEMS.map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                        <input 
                          type="checkbox" 
                          checked={formData.checklist.includes(item.id)}
                          onChange={() => toggleChecklist(item.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className={`text-sm font-medium ${formData.checklist.includes(item.id) ? 'text-gray-900 line-through opacity-60' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.checklist.includes('signed') && (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-medium border border-emerald-100 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                      Khách hàng đã ký hợp đồng! Khi lưu, hệ thống sẽ đề xuất chuyển sang Quản lý Dự án.
                    </div>
                  )}
                </div>

                {/* Activity Log */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-purple-500" /> Nhật ký chăm sóc
                  </h3>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newLog}
                      onChange={e => setNewLog(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddLog())}
                      placeholder="VD: Gọi lần 1 - Khách bận..." 
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={handleAddLog}
                      className="p-2 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {formData.activityLog.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-4 italic">Chưa có nhật ký nào</div>
                    ) : (
                      formData.activityLog.map((log, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative pl-4">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200 rounded-l-lg"></div>
                          <div className="text-[10px] text-gray-400 font-medium mb-1">{log.date}</div>
                          <div className="text-sm text-gray-700">{log.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            form="customer-form"
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors"
          >
            Lưu thông tin
          </button>
        </div>
      </div>
    </div>
  );
}
