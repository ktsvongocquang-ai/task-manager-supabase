import { useState } from 'react';
import { Search, Filter, Plus, Phone, Facebook, Sparkles, Edit2, Trash2, CheckSquare, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerModal from './components/CustomerModal';

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
      { date: '10/03/2026 10:00', content: 'Đã gặp mặt tại quán cafe, khách ưng ý concept ban đầu.' },
      { date: '08/03/2026 14:30', content: 'Gửi profile công ty và một số mẫu nhà phố.' },
      { date: '08/03/2026 09:15', content: 'Gọi điện lần 1, khách hẹn cuối tuần gặp.' }
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
      { date: '09/03/2026 16:00', content: 'Đã gửi báo giá qua Zalo, khách đang xem xét.' },
      { date: '07/03/2026 11:00', content: 'Gọi điện tư vấn các gói vật liệu.' }
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

export default function CustomerList() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(initialMockCustomers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const handleCreateQuote = (customer: any) => {
    navigate('/customers/quotes/new', { state: { customer } });
  };

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

  const handleDeleteCustomer = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mới': return 'bg-blue-100 text-blue-700';
      case 'Đang liên hệ': return 'bg-yellow-100 text-yellow-700';
      case 'Đang tư vấn': return 'bg-purple-100 text-purple-700';
      case 'Báo giá': return 'bg-orange-100 text-orange-700';
      case 'Chốt': return 'bg-emerald-100 text-emerald-700';
      case 'Mất': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Danh sách Khách hàng</h2>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <Link 
              to="/customers/kanban"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Kanban
            </Link>
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm khách hàng, số điện thoại..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[250px]">Khách hàng</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Nhu cầu dự án</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[250px]">Định hướng thiết kế</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Ghi chú & Tiến trình</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors group align-top">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      {customer.namePhone}
                      <a href={`tel:${customer.namePhone.split('-')[1]?.trim()}`} className="p-1 bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition-colors" title="Gọi điện">
                        <Phone className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {customer.facebookUrl && (
                        <a href={customer.facebookUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Facebook className="w-3 h-3" /> FB Profile
                        </a>
                      )}
                      {customer.birthYear && (
                        <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          <Sparkles className="w-3 h-3" /> {customer.birthYear} ({customer.generation} - Mệnh {customer.fengShui})
                        </span>
                      )}
                    </div>
                    {customer.address && (
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={customer.address}>
                        📍 {customer.address}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{customer.propertyType}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-600">{customer.serviceCategory}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        DT: <span className="font-medium text-gray-700">{customer.area} m²</span> | 
                        Ngân sách: <span className="font-medium text-emerald-600">{customer.budget}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        ⏱ {customer.timing} <span className="text-gray-300">•</span> {customer.source}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 text-xs">
                      {(customer.style || customer.colorTone || customer.keyConcern) ? (
                        <>
                          {customer.style && customer.style !== 'Chưa xác định' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 w-12">Style:</span>
                              <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{customer.style}</span>
                            </div>
                          )}
                          {customer.colorTone && customer.colorTone !== 'Chưa xác định' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 w-12">Tone:</span>
                              <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{customer.colorTone}</span>
                            </div>
                          )}
                          {customer.keyConcern && customer.keyConcern !== 'Chưa xác định' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500 w-12">Ưu tiên:</span>
                              <span className="font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded">{customer.keyConcern}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Chưa có thông tin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-600 line-clamp-2" title={customer.notes}>
                        {customer.notes || '-'}
                      </p>
                      {customer.checklist && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(customer.checklist.length / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-medium text-gray-500">{customer.checklist.length}/5</span>
                        </div>
                      )}
                      {customer.activityLog && customer.activityLog.length > 0 && (
                        <div className="text-[10px] text-gray-500 truncate mt-1" title={customer.activityLog[0].content}>
                          <span className="font-medium text-gray-700">Mới nhất:</span> {customer.activityLog[0].content}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCreateQuote(customer)}
                        className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-50 flex items-center gap-1 text-xs font-medium transition-colors" 
                        title="Tạo báo giá"
                      >
                        <FileText className="w-4 h-4" />
                        Báo giá
                      </button>
                      <button 
                        onClick={() => handleOpenModal(customer)}
                        className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
          <div>Hiển thị 1 đến {customers.length} của {customers.length} khách hàng</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 transition-colors">Trước</button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded-md font-medium shadow-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-white transition-colors">Sau</button>
          </div>
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
