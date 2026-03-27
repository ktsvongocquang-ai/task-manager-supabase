import React from 'react';
import { Search, Filter, Plus, MoreVertical, Download, FileText } from 'lucide-react';

const mockInvoices = [
  { id: 'INV-2023-001', client: 'Công ty TNHH Alpha', amount: '150,000,000 ₫', status: 'Đã thanh toán', issueDate: '2023-10-01', dueDate: '2023-10-15' },
  { id: 'INV-2023-002', client: 'Tập đoàn Beta', amount: '45,000,000 ₫', status: 'Chờ thanh toán', issueDate: '2023-10-20', dueDate: '2023-11-05' },
  { id: 'INV-2023-003', client: 'Công ty CP Gamma', amount: '80,000,000 ₫', status: 'Quá hạn', issueDate: '2023-09-15', dueDate: '2023-09-30' },
  { id: 'INV-2023-004', client: 'Delta Corp', amount: '12,500,000 ₫', status: 'Đã thanh toán', issueDate: '2023-10-10', dueDate: '2023-10-25' },
];

export default function Invoices() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Hóa đơn</h2>
        <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo Hóa đơn mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm hóa đơn..." 
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
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã Hóa đơn</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tiền</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày xuất</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạn thanh toán</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer">{invoice.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {invoice.client}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                    {invoice.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Đã thanh toán' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'Chờ thanh toán' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'Quá hạn' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoice.issueDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoice.dueDate}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50" title="Tải xuống">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
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
