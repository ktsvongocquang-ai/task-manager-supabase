import { useSearchParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, Users, Target, CheckSquare, Briefcase, FileText, 
  Clock, DollarSign, TrendingUp
} from 'lucide-react';
import CustomerList from './CustomerList';
import Leads from './Leads';
import TaskTracking from './TaskTracking';
import Projects from './Projects';
import GanttChart from './GanttChart';
import Invoices from './Invoices';
import FacebookAdsAnalyzer from './FacebookAdsAnalyzer';

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

export const Customers = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'DASHBOARD';

  const menuItems = [
    { id: 'DASHBOARD', name: 'Tổng quan', icon: LayoutDashboard },
    { id: 'CUSTOMERS', name: 'Khách hàng', icon: Users },
    { id: 'LEADS', name: 'KH Tiềm năng', icon: Target },
    { id: 'TASKS', name: 'Theo dõi Task', icon: CheckSquare },
    { id: 'PROJECTS', name: 'Dự án', icon: Briefcase },
    { id: 'GANTT', name: 'Gantt Chart', icon: Clock },
    { id: 'INVOICES', name: 'Hóa đơn', icon: FileText },
    { id: 'ACTIVITY_LOG', name: 'Nhật ký', icon: Clock },
    { id: 'FB_ADS_AI', name: 'AI Phân tích Ads', icon: TrendingUp },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tổng quan CRM</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý và theo dõi hoạt động chăm sóc khách hàng</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-slate-100 transition-colors cursor-pointer">
            <option>Tháng này</option>
            <option>Tháng trước</option>
            <option>Năm nay</option>
          </select>
          <button className="flex-1 sm:flex-none bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Tổng Khách Hàng', value: '2,543', change: '+12.5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { title: 'Doanh Thu', value: '$45,231', change: '+8.2%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { title: 'Tỷ Lệ Chuyển Đổi', value: '24.8%', change: '+2.4%', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { title: 'Tăng Trưởng', value: '+15.3%', change: '+4.1%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-white p-5 rounded-2xl border ${kpi.border} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
               <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${kpi.bg} opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-sm">
                  {kpi.change}
                </span>
              </div>
              <h3 className="text-slate-500 text-sm font-semibold mb-1 relative z-10">{kpi.title}</h3>
              <p className="text-2xl font-black text-slate-800 relative z-10">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Hiệu suất Sales
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dx={-10} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 600 }}
                  itemStyle={{ fontSize: '14px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '14px' }} />
                <Bar dataKey="sales" name="Thực tế" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="target" name="Mục tiêu" fill="#c7d2fe" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Target className="w-5 h-5 text-purple-500" /> Tỷ lệ chuyển đổi
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {conversionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 600, fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <LineChart className="w-5 h-5 text-emerald-500 inline" /> Xu hướng tăng trưởng
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                  itemStyle={{ fontSize: '14px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '14px' }} />
                <Line type="monotone" dataKey="leads" name="Lead mới" stroke="#06b6d4" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="customers" name="Khách hàng" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" /> Hoạt động gần đây
             </h3>
             <button className="text-sm text-indigo-600 font-bold hover:text-indigo-700">Xem tất cả</button>
          </div>
          <div className="space-y-6">
            {[
              { title: 'Cuộc gọi với Nguyễn Văn A', time: '10 phút trước', type: 'call', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
              { title: 'Gửi báo giá cho Công ty XYZ', time: '1 giờ trước', type: 'email', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
              { title: 'Chốt hợp đồng dự án Alpha', time: '3 giờ trước', type: 'deal', color: 'bg-purple-100 text-purple-600 border-purple-200' },
              { title: 'Thêm lead mới từ Facebook', time: 'Hôm qua', type: 'lead', color: 'bg-rose-100 text-rose-600 border-rose-200' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4 group">
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border ${activity.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <div className="w-4 h-4 rounded-full bg-current opacity-60"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors cursor-pointer">{activity.title}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (title: string) => (
    <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-2xl border border-slate-200 shadow-sm text-center p-8">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
        <LayoutDashboard className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md">
        Phân hệ {title.toLowerCase()} đang được phát triển theo giao diện Light Theme mới. Vui lòng quay lại Tổng quan.
      </p>
    </div>
  );

  return (
    <div className="w-full bg-slate-50 font-sans">
      {/* Content Area */}
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Active View Content */}
          <div className="container mx-auto">
            {activeTab === 'DASHBOARD' && renderDashboard()}
            {activeTab === 'CUSTOMERS' && <CustomerList />}
            {activeTab === 'LEADS' && <Leads />}
            {activeTab === 'TASKS' && <TaskTracking />}
            {activeTab === 'PROJECTS' && <Projects />}
            {activeTab === 'GANTT' && <GanttChart />}
            {activeTab === 'INVOICES' && <Invoices />}
            {activeTab === 'FB_ADS_AI' && <FacebookAdsAnalyzer />}
            {!['DASHBOARD', 'CUSTOMERS', 'LEADS', 'TASKS', 'PROJECTS', 'GANTT', 'INVOICES', 'FB_ADS_AI'].includes(activeTab) && renderPlaceholder(menuItems.find(item => item.id === activeTab)?.name || 'Tính năng')}
          </div>
        </div>
      </div>
    </div>
  );
};

