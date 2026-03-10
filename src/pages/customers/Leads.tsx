
import { Search, Filter, Plus, MoreVertical, Mail, Phone, ExternalLink } from 'lucide-react';

const mockLeads = [
  { id: 'LD-001', name: 'Nguyễn Văn F', email: 'nguyenvanf@example.com', phone: '0956789012', source: 'Facebook Ads', score: 85, status: 'Mới', date: '2023-10-26' },
  { id: 'LD-002', name: 'Trần Thị G', email: 'tranthig@example.com', phone: '0967890123', source: 'Google Search', score: 60, status: 'Đã liên hệ', date: '2023-10-25' },
  { id: 'LD-003', name: 'Lê Văn H', email: 'levanh@example.com', phone: '0978901234', source: 'Referral', score: 92, status: 'Tiềm năng cao', date: '2023-10-24' },
  { id: 'LD-004', name: 'Phạm Thị I', email: 'phamthii@example.com', phone: '0989012345', source: 'Website', score: 45, status: 'Không quan tâm', date: '2023-10-20' },
  { id: 'LD-005', name: 'Hoàng Văn K', email: 'hoangvank@example.com', phone: '0990123456', source: 'Sự kiện Offline', score: 75, status: 'Đã liên hệ', date: '2023-10-26' },
];

export default function Leads() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Khách hàng Tiềm năng (Leads)</h2>
        <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm Lead mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm lead..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nguồn</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm chất lượng</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="text-xs text-gray-500">{lead.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      {lead.source}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-[4rem]">
                        <div 
                          className={`h-2 rounded-full ${
                            lead.score >= 80 ? 'bg-green-500' : 
                            lead.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${lead.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === 'Mới' ? 'bg-cyan-100 text-cyan-800' :
                      lead.status === 'Đã liên hệ' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'Tiềm năng cao' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lead.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
