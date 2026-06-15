
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Plus, Search, Filter } from 'lucide-react';
import { SmartCard } from '../../components/layout/SmartCard';

const taskStatusData = [
  { name: 'Hoàn thành', value: 45, color: '#22c55e' },
  { name: 'Đang xử lý', value: 30, color: '#3b82f6' },
  { name: 'Quá hạn', value: 15, color: '#ef4444' },
  { name: 'Chưa bắt đầu', value: 10, color: '#94a3b8' },
];

const mockTasks = [
  { id: 'TSK-001', title: 'Gửi email chúc mừng sinh nhật', lead: 'Nguyễn Văn A', assignee: 'Trần Sales', dueDate: '2023-10-30', status: 'Hoàn thành', priority: 'Trung bình' },
  { id: 'TSK-002', title: 'Kiểm tra tình trạng hợp đồng', lead: 'Công ty TNHH Alpha', assignee: 'Lê Support', dueDate: '2023-11-02', status: 'Đang xử lý', priority: 'Cao' },
  { id: 'TSK-003', title: 'Gọi điện tư vấn gói Premium', lead: 'Trần Thị B', assignee: 'Trần Sales', dueDate: '2023-10-25', status: 'Quá hạn', priority: 'Cao' },
  { id: 'TSK-004', title: 'Chuẩn bị tài liệu thuyết trình', lead: 'Tập đoàn Beta', assignee: 'Phạm Marketing', dueDate: '2023-11-05', status: 'Chưa bắt đầu', priority: 'Trung bình' },
  { id: 'TSK-005', title: 'Follow up sau demo', lead: 'Lê Văn C', assignee: 'Trần Sales', dueDate: '2023-11-01', status: 'Đang xử lý', priority: 'Cao' },
];

export default function TaskTracking() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Theo dõi Công việc (Task)</h2>
        <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Tạo Task mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê trạng thái</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tổng quan hôm nay</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Đã hoàn thành</span>
                </div>
                <span className="text-xl font-bold text-green-700">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Đang thực hiện</span>
                </div>
                <span className="text-xl font-bold text-blue-700">8</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Quá hạn</span>
                </div>
                <span className="text-xl font-bold text-red-700">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Data Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900">Danh sách công việc</h3>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Tìm task..." 
                  className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>
              <button className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[400px]">
            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col p-4 gap-4 bg-gray-50/30">
              {mockTasks.map((task) => (
                <SmartCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  subtitle={task.lead}
                  status={task.status}
                  statusColor={
                    task.status === 'Hoàn thành' ? 'bg-green-100 text-green-800 border-green-200' :
                    task.status === 'Đang xử lý' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    task.status === 'Quá hạn' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }
                  avatarInitials={task.assignee.charAt(0)}
                  deadline={`Hạn: ${task.dueDate}`}
                />
              ))}
            </div>

            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên quan đến</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người phụ trách</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạn chót</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{task.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.lead}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                          {task.assignee.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                        task.status === 'Đang xử lý' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'Quá hạn' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-200 flex items-center justify-center">
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Xem tất cả công việc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
