import React from 'react';
import { Search, Filter, Clock, User, FileEdit, Trash2, PlusCircle, Settings } from 'lucide-react';

const mockLogs = [
  { id: 1, user: 'Admin', action: 'Cập nhật trạng thái', target: 'Lead LD-001', time: '10 phút trước', type: 'update' },
  { id: 2, user: 'Trần Sales', action: 'Thêm mới khách hàng', target: 'Công ty TNHH Alpha', time: '1 giờ trước', type: 'create' },
  { id: 3, user: 'Lê Support', action: 'Xóa task', target: 'TSK-009', time: '3 giờ trước', type: 'delete' },
  { id: 4, user: 'Admin', action: 'Đăng nhập hệ thống', target: '', time: 'Hôm qua', type: 'system' },
  { id: 5, user: 'Phạm Marketing', action: 'Cập nhật thông tin', target: 'Dự án PRJ-002', time: '2 ngày trước', type: 'update' },
];

export default function Logs() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'create': return <PlusCircle className="w-4 h-4 text-green-500" />;
      case 'update': return <FileEdit className="w-4 h-4 text-blue-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'system': return <Settings className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Nhật ký Hệ thống (Audit Logs)</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhật ký..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        <div className="p-6">
          <div className="relative border-l border-gray-200 ml-3 space-y-8">
            {mockLogs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <span className="absolute -left-[17px] top-1 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                  {getIcon(log.type)}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">{log.user}</span>
                      {' '}đã{' '}
                      <span className="font-medium">{log.action}</span>
                      {log.target && (
                        <>
                          {' '}với{' '}
                          <span className="font-semibold text-gray-800">{log.target}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {log.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Tải thêm nhật ký
          </button>
        </div>
      </div>
    </div>
  );
}
