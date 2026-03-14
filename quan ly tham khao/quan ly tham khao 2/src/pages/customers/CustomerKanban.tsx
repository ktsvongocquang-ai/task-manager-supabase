import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreHorizontal, Phone, Facebook, Sparkles, Palette } from 'lucide-react';
import CustomerModal from './components/CustomerModal';

const columns = [
  { id: 'Mới', title: 'Mới', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'Đang liên hệ', title: 'Đang liên hệ', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { id: 'Đang tư vấn', title: 'Đang tư vấn', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'Báo giá', title: 'Báo giá', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  { id: 'Chốt', title: 'Chốt', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { id: 'Mất', title: 'Mất', color: 'bg-red-50 border-red-200 text-red-800' },
];

const initialMockCustomers = [
  { 
    id: 1, 
    namePhone: 'Anh Phong - 0909601570', 
    facebookUrl: 'https://fb.com/phong',
    birthYear: '1992',
    generation: 'Millennials',
    fengShui: 'Kim',
    careSuggestion: 'Giao tiếp nhanh qua Zalo, tư vấn các giải pháp thông minh (Smart home).',
    address: 'Quận 11',
    propertyType: 'Nhà phố',
    serviceCategory: 'Thiết kế',
    area: '105',
    budget: '500tr - 1 tỷ',
    timing: 'Làm ngay',
    source: 'Referral',
    style: 'Hiện đại (Modern)',
    colorTone: 'Sáng (Trắng/Be)',
    keyConcern: 'Thiết kế có gu',
    notes: 'Cải tạo nhà 1 trệt 1 lầu. Hiện trạng 1 PN -> muốn 3 PN, 2 WC.',
    status: 'Đang tư vấn',
    checklist: ['called', 'sentInfo', 'met'],
    activityLog: [
      { date: '10/03/2026 10:00', content: 'Đã gặp mặt tại quán cafe, khách ưng ý concept ban đầu.' }
    ]
  },
  { 
    id: 2, 
    namePhone: 'Chị Mi - 0934147466', 
    facebookUrl: '',
    birthYear: '1995',
    generation: 'Millennials',
    fengShui: 'Hỏa',
    careSuggestion: 'Giao tiếp nhanh qua Zalo, tư vấn các giải pháp thông minh (Smart home).',
    address: 'Miyuki Bình Chánh',
    propertyType: 'Căn hộ',
    serviceCategory: 'Trọn gói',
    area: '99',
    budget: '500tr - 1 tỷ',
    timing: 'Tháng tới',
    source: 'FB Ads',
    style: 'Tối giản (Minimalist)',
    colorTone: 'Trung tính',
    keyConcern: 'Ngân sách (Tối ưu)',
    notes: 'Kinh phí Hiện đại đơn giản.',
    status: 'Báo giá',
    checklist: ['called', 'sentInfo', 'quoted'],
    activityLog: [
      { date: '09/03/2026 16:00', content: 'Đã gửi báo giá qua Zalo, khách đang xem xét.' }
    ]
  },
  { 
    id: 3, 
    namePhone: 'Chị Thanh Hảo - 0976979049', 
    facebookUrl: 'https://fb.com/thanhhao',
    birthYear: '1988',
    generation: 'Millennials',
    fengShui: 'Mộc',
    careSuggestion: 'Giao tiếp nhanh qua Zalo, tư vấn các giải pháp thông minh (Smart home).',
    address: 'Vĩnh Lộc - Bình Tân',
    propertyType: 'Nhà phố',
    serviceCategory: 'Trọn gói',
    area: '80',
    budget: '> 3 tỷ',
    timing: 'Đang tham khảo',
    source: 'Google',
    style: 'Wabi Sabi',
    colorTone: 'Màu ấm (Gỗ/Đất)',
    keyConcern: 'Chất lượng/Bền vững',
    notes: 'Nhà 1 hầm, 1 trệt, 2 lầu, sân thượng. Đã hoàn công.',
    status: 'Đang liên hệ',
    checklist: ['called'],
    activityLog: [
      { date: '10/03/2026 08:30', content: 'Gọi lần 1 khách không nghe máy.' }
    ]
  },
];

export default function CustomerKanban() {
  const [customers, setCustomers] = useState(initialMockCustomers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const handleOpenModal = (customer?: any) => {
    setEditingCustomer(customer || null);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (customerData: any) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...customerData, id: c.id } : c));
    } else {
      setCustomers([{ ...customerData, id: Date.now() }, ...customers]);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Kanban Khách hàng</h2>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <Link 
              to="/customers/list"
              className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors text-gray-500 hover:text-gray-900"
            >
              List
            </Link>
            <button 
              className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors bg-white text-gray-900 shadow-sm"
            >
              Kanban
            </button>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full">
          {columns.map(col => {
            const columnCustomers = customers.filter(c => c.status === col.id);
            return (
              <div key={col.id} className="w-80 flex flex-col bg-gray-50/50 rounded-xl border border-gray-200">
                <div className={`p-3 border-b border-gray-200 rounded-t-xl flex items-center justify-between ${col.color.split(' ')[0]}`}>
                  <h3 className={`font-semibold text-sm ${col.color.split(' ')[2]}`}>{col.title}</h3>
                  <span className="bg-white/60 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {columnCustomers.length}
                  </span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {columnCustomers.map(customer => (
                    <div 
                      key={customer.id} 
                      onClick={() => handleOpenModal(customer)}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800">
                          {customer.propertyType}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h4 className="font-bold text-gray-900 mb-1">{customer.namePhone.split('-')[0]?.trim()}</h4>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2" title={customer.notes}>{customer.notes || 'Chưa có ghi chú'}</p>
                      
                      {customer.birthYear && (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-2 w-fit">
                          <Sparkles className="w-3 h-3" /> {customer.generation} - Mệnh {customer.fengShui}
                        </div>
                      )}

                      {customer.style && customer.style !== 'Chưa xác định' && (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded mb-3 w-fit">
                          <Palette className="w-3 h-3" /> {customer.style}
                        </div>
                      )}

                      {customer.checklist && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(customer.checklist.length / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-medium text-gray-500">{customer.checklist.length}/5</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex gap-2">
                          <a href={`tel:${customer.namePhone.split('-')[1]?.trim()}`} onClick={e => e.stopPropagation()} className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors cursor-pointer" title="Gọi điện">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          {customer.facebookUrl && (
                            <a href={customer.facebookUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer" title="Facebook">
                              <Facebook className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <span className="text-xs font-bold text-emerald-600">{customer.budget}</span>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => handleOpenModal({ status: col.id })}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-dashed border-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm thẻ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
      />
    </div>
  );
}
