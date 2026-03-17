import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, MessageSquare, ListPlus, Send, CheckCircle2, Calendar } from 'lucide-react';
import { BottomSheet } from '../../../components/layout/BottomSheet';
import { TimelineUpdateModal } from '../../marketing/components/TimelineUpdateModal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: any) => void;
  initialData?: any;
}

const CONTRACT_STATUSES = ['Đang soạn HĐ', 'Đã ký HĐ Thiết kế', 'Đang thiết kế', 'Chờ duyệt Concept', 'Đã chốt 3D', 'Bàn giao Hồ sơ', 'Đã ký HĐ Thi công'];
const PAYMENT_STAGES = [
  { id: 1, name: 'Đợt 1: Cọc thiết kế (30%)' },
  { id: 2, name: 'Đợt 2: Chốt 3D (50%)' },
  { id: 3, name: 'Đợt 3: Bàn giao hồ sơ (20%)' },
  { id: 4, name: 'Đợt 4: Cọc thi công (30%)' }
];

export default function ProjectModal({ isOpen, onClose, onSave, initialData }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    contractStatus: 'Đang soạn HĐ',
    payments: [] as number[],
    feedbackRounds: 0,
    activityLog: [] as { date: string, content: string }[]
  });

  const [newLog, setNewLog] = useState('');
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...formData, 
        ...initialData,
        payments: initialData.payments || [],
        activityLog: initialData.activityLog || []
      });
    } else {
      setFormData({
        name: '', client: '', contractStatus: 'Đang soạn HĐ', payments: [], feedbackRounds: 0, activityLog: []
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

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

  const togglePayment = (id: number) => {
    let newPayments = [...formData.payments];
    if (newPayments.includes(id)) {
      newPayments = newPayments.filter(item => item !== id);
    } else {
      newPayments.push(id);
    }
    setFormData({ ...formData, payments: newPayments });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center gap-4">
        <span>{initialData ? 'Chi tiết Dự án' : 'Thêm Dự án mới'}</span>
        {initialData && (
          <button 
            type="button"
            onClick={() => setIsTimelineModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-indigo-100"
          >
            <Calendar size={16} />
            Tiến độ & Mốc quay
          </button>
        )}
      </div>
    }>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white shrink-0 h-full max-h-full">
        <form id="project-form" onSubmit={handleSubmit} className="space-y-8 pb-24">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Info & Status */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Thông tin chung
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên dự án</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Khách hàng</label>
                    <input required type="text" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Trạng thái Hợp đồng / Thiết kế</label>
                    <select value={formData.contractStatus} onChange={e => setFormData({...formData, contractStatus: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                      {CONTRACT_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-emerald-200 pb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Tiến độ thanh toán (Kế toán)
                  </h3>
                  <div className="space-y-2">
                    {PAYMENT_STAGES.map(stage => (
                      <label key={stage.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                        <input 
                          type="checkbox" 
                          checked={formData.payments.includes(stage.id)}
                          onChange={() => togglePayment(stage.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <span className={`text-sm font-medium ${formData.payments.includes(stage.id) ? 'text-gray-900 line-through opacity-60' : 'text-gray-700'}`}>
                          {stage.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Feedback & Logs */}
              <div className="space-y-6">
                <div className="space-y-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-orange-200 pb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-500" /> Phản hồi thiết kế
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Số lần khách yêu cầu sửa đổi:</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setFormData({...formData, feedbackRounds: Math.max(0, formData.feedbackRounds - 1)})} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">-</button>
                      <span className="font-bold text-lg w-4 text-center">{formData.feedbackRounds}</span>
                      <button type="button" onClick={() => setFormData({...formData, feedbackRounds: formData.feedbackRounds + 1})} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">+</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-purple-500" /> Nhật ký dự án
                  </h3>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newLog}
                      onChange={e => setNewLog(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddLog())}
                      placeholder="VD: Đã gửi phương án mặt bằng..." 
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={handleAddLog}
                      className="p-2 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
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

            {/* Action: Send Construction Quote */}
            {formData.contractStatus === 'Bàn giao Hồ sơ' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Đã hoàn thành Thiết kế
                  </h4>
                  <p className="text-sm text-indigo-700 mt-1">Khách hàng đã chốt hồ sơ. Đã đến lúc gửi Báo giá Thi công.</p>
                </div>
                <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm">
                  Tạo Báo giá Thi công
                </button>
              </div>
            )}

          </form>
      </div>

      {/* Fixed Footer within BottomSheet content area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white flex items-center justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 sm:flex-none px-5 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Đóng
        </button>
        <button 
          type="submit" 
          form="project-form"
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors"
        >
          Lưu Dự án
        </button>
      </div>
      {initialData && (
        <TimelineUpdateModal 
          isOpen={isTimelineModalOpen}
          onClose={() => setIsTimelineModalOpen(false)}
          project={initialData}
          onSaved={() => {
            setIsTimelineModalOpen(false);
            // Optionally, we could trigger a refetch of the project here if needed,
            // but closing the modal is usually enough to see the updated Gantt if they close ProjectModal too.
          }}
        />
      )}
    </BottomSheet>
  );
}
