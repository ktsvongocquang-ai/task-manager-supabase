import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Users, DollarSign, Target, TrendingUp } from 'lucide-react';

const conversionData = [
  { name: 'Mới', value: 400 },
  { name: 'Đang thuyết phục', value: 300 },
  { name: 'Đã chốt', value: 300 },
  { name: 'Thất bại', value: 200 },
];

const COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#ef4444'];

const salesData = [
  { name: 'T1', sales: 4000, target: 2400 },
  { name: 'T2', sales: 3000, target: 1398 },
  { name: 'T3', sales: 2000, target: 9800 },
  { name: 'T4', sales: 2780, target: 3908 },
  { name: 'T5', sales: 1890, target: 4800 },
  { name: 'T6', sales: 2390, target: 3800 },
  { name: 'T7', sales: 3490, target: 4300 },
];

const trendData = [
  { name: 'Tuần 1', leads: 40, customers: 24 },
  { name: 'Tuần 2', leads: 30, customers: 13 },
  { name: 'Tuần 3', leads: 20, customers: 98 },
  { name: 'Tuần 4', leads: 27, customers: 39 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tổng quan CRM</h2>
        <div className="flex gap-2">
          <select className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>Tháng này</option>
            <option>Tháng trước</option>
            <option>Năm nay</option>
          </select>
          <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Tổng Khách Hàng', value: '2,543', change: '+12.5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Doanh Thu', value: '$45,231', change: '+8.2%', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
          { title: 'Tỷ Lệ Chuyển Đổi', value: '24.8%', change: '+2.4%', icon: Target, color: 'text-purple-600', bg: 'bg-purple-100' },
          { title: 'Tăng Trưởng', value: '+15.3%', change: '+4.1%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {kpi.change}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">{kpi.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Hiệu suất Sales</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="sales" name="Thực tế" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Mục tiêu" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Tỷ lệ chuyển đổi</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Xu hướng tăng trưởng</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="leads" name="Lead mới" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="customers" name="Khách hàng" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Hoạt động gần đây</h3>
          <div className="space-y-6">
            {[
              { title: 'Cuộc gọi với Nguyễn Văn A', time: '10 phút trước', type: 'call', color: 'bg-blue-100 text-blue-600' },
              { title: 'Gửi báo giá cho Công ty XYZ', time: '1 giờ trước', type: 'email', color: 'bg-green-100 text-green-600' },
              { title: 'Chốt hợp đồng dự án Alpha', time: '3 giờ trước', type: 'deal', color: 'bg-purple-100 text-purple-600' },
              { title: 'Thêm lead mới từ Facebook', time: 'Hôm qua', type: 'lead', color: 'bg-orange-100 text-orange-600' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${activity.color}`}>
                  <div className="w-4 h-4 rounded-full bg-current opacity-50"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
