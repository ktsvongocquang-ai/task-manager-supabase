
import { Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

const projects = [
  { id: 1, name: 'Phát triển web cho công ty B', client: '3.Lê Thị Lan', start: '2024-04-05', end: '2024-05-10', progress: 100, status: 'Hoàn thành' },
  { id: 2, name: 'Thiết kế & phát triển app cho công ty A', client: '1.Nguyễn An', start: '2024-04-12', end: '2024-04-19', progress: 100, status: 'Hoàn thành' },
  { id: 3, name: 'Xây dựng lại branding và lên chiến dịch marketing', client: '4.Phạm Văn Dũng', start: '2024-04-13', end: '2024-04-13', progress: 20, status: 'Đang tiến hành' },
  { id: 4, name: 'Phát triển web cho anh C', client: '6.Nguyễn Văn C', start: '2024-04-23', end: '2024-05-16', progress: 0, status: 'Chưa bắt đầu' },
];

const chartData = [
  { name: 'HOÀN THÀNH', value: 2 },
  { name: 'CHƯA HOÀN THÀNH', value: 2 }
];

const days = Array.from({ length: 30 }, (_, i) => {
  const date = i + 1;
  const dateStr = `2024-04-${date.toString().padStart(2, '0')}`;
  const dateObj = new Date(dateStr);
  const dowMap = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return {
    date,
    dateStr,
    dow: dowMap[dateObj.getDay()]
  };
});

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(day)}/${parseInt(month)}/${year}`;
};

const renderStatus = (status: string) => {
  switch (status) {
    case 'Hoàn thành': return '✅ Hoàn thành';
    case 'Đang tiến hành': return '⏸ Đang tiến hành';
    case 'Chưa bắt đầu': return '💤 Chưa bắt đầu';
    default: return status;
  }
};

export default function GanttChart() {
  return (
    <div className="space-y-6 min-w-max">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-8 h-8 text-gray-800" />
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">GANTT CHART</h1>
      </div>

      <div className="flex flex-wrap gap-6 mb-8">
        {/* Box 1 */}
        <div className="border border-gray-300 rounded-sm bg-white w-64 shadow-sm">
          <div className="bg-gray-100 p-2 text-center font-bold text-sm border-b border-gray-300">NĂM</div>
          <div className="p-2 text-center text-sm border-b border-gray-300">2024</div>
          <div className="bg-gray-100 p-2 text-center font-bold text-sm border-b border-gray-300">THÁNG</div>
          <div className="p-2 text-center text-sm">
            <select className="w-full text-center outline-none bg-transparent cursor-pointer">
              <option>April</option>
            </select>
          </div>
        </div>

        {/* Box 2 */}
        <div className="border border-gray-300 rounded-sm bg-white w-80 shadow-sm flex flex-col">
          <div className="bg-gray-100 p-2 text-center font-bold text-sm border-b border-gray-300">KHÔNG HIỂN THỊ NHỮNG DỰ ÁN<br/>CÓ TRẠNG THÁI SAU</div>
          <div className="p-1 border-b border-gray-300 flex-1"><select className="w-full outline-none bg-transparent text-sm"><option></option></select></div>
          <div className="p-1 border-b border-gray-300 flex-1"><select className="w-full outline-none bg-transparent text-sm"><option></option></select></div>
          <div className="p-1 border-b border-gray-300 flex-1"><select className="w-full outline-none bg-transparent text-sm"><option></option></select></div>
          <div className="p-1 flex-1"><select className="w-full outline-none bg-transparent text-sm"><option></option></select></div>
        </div>

        {/* Box 3 */}
        <div className="border border-gray-300 rounded-sm bg-white w-80 shadow-sm">
          <div className="bg-gray-100 p-2 text-center font-bold text-sm border-b border-gray-300 mb-2">HOÀN THÀNH VS CHƯA HT</div>
          <div className="h-32 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} ticks={[0, 1, 2, 3, 4]} axisLine={false} tickLine={false} />
                <Bar dataKey="value" barSize={40}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#93c5fd' : '#a7f3d0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-300 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th rowSpan={2} className="border border-gray-300 bg-indigo-100/50 p-2 text-center font-bold sticky left-0 z-20 min-w-[250px]">TÊN DỰ ÁN</th>
              <th rowSpan={2} className="border border-gray-300 bg-indigo-100/50 p-2 text-center font-bold sticky left-[250px] z-20 min-w-[180px]">TÊN KHÁCH HÀNG</th>
              <th rowSpan={2} className="border border-gray-300 bg-indigo-100/50 p-2 text-center font-bold sticky left-[430px] z-20 min-w-[120px]">NGÀY BẮT ĐẦU</th>
              <th rowSpan={2} className="border border-gray-300 bg-indigo-100/50 p-2 text-center font-bold sticky left-[550px] z-20 min-w-[120px]">NGÀY KẾT THÚC</th>
              <th rowSpan={2} className="border border-gray-300 bg-indigo-100/50 p-2 text-center font-bold sticky left-[670px] z-20 min-w-[100px]">TIẾN ĐỘ %</th>
              <th rowSpan={2} className="border border-gray-300 bg-indigo-100/50 p-2 text-center font-bold sticky left-[770px] z-20 min-w-[150px]">TRẠNG THÁI</th>
              {days.map(d => (
                <th key={`dow-${d.date}`} className="border border-gray-300 bg-white p-1 text-center text-xs font-normal min-w-[35px]">
                  {d.dow}
                </th>
              ))}
            </tr>
            <tr>
              {days.map(d => (
                <th key={`date-${d.date}`} className="border border-gray-300 bg-white p-1 text-center text-xs font-normal">
                  {d.date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="h-12">
                <td className="border border-gray-300 p-2 sticky left-0 bg-white z-10">{p.name}</td>
                <td className="border border-gray-300 p-2 text-center sticky left-[250px] bg-white z-10">{p.client}</td>
                <td className="border border-gray-300 p-2 text-center sticky left-[430px] bg-white z-10">{formatDate(p.start)}</td>
                <td className="border border-gray-300 p-2 text-center sticky left-[550px] bg-white z-10">{formatDate(p.end)}</td>
                <td className="border border-gray-300 p-2 text-center sticky left-[670px] bg-white z-10">{p.progress}%</td>
                <td className="border border-gray-300 p-2 text-center sticky left-[770px] bg-white z-10 whitespace-nowrap">
                   {renderStatus(p.status)}
                </td>
                {days.map(d => {
                   const cellDate = d.dateStr;
                   const isActive = cellDate >= p.start && cellDate <= p.end;
                   const isStart = cellDate === p.start || (cellDate === '2024-04-01' && p.start < '2024-04-01');
                   
                   let bgClass = '';
                   if (isActive) {
                     if (p.status === 'Hoàn thành' || p.status === 'Đang tiến hành') {
                       bgClass = 'bg-[#a7f3d0]'; // light green
                     } else {
                       bgClass = 'bg-gray-300'; // gray
                     }
                   }
                   
                   return (
                     <td key={`cell-${p.id}-${d.date}`} className={`border border-gray-300 p-0 relative ${bgClass}`}>
                       {isStart && isActive && (
                         <div className="absolute inset-0 flex items-center pl-1 text-xs text-gray-800 z-0 whitespace-nowrap overflow-visible">
                           {p.progress}%
                         </div>
                       )}
                     </td>
                   );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
