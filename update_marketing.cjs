const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/pages/marketing/MarketingApp.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove "Tổng quan" tab
content = content.replace(
  /<button\s+className={`px-4 py-1\.5 rounded-md text-sm font-medium transition-colors \${view === 'KPI' \? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}\s+onClick={\(\) => setView\('KPI'\)}\s+>\s+Tổng quan\s+<\/button>/g,
  ''
);

// 2. Remove KPI View Block
content = content.replace(
  /\) : view === 'KPI' \? \([\s\S]*?\) : view === 'WORKFLOW' \? \(/g,
  ") : view === 'WORKFLOW' ? ("
);

// 3. Replace Summary Cards with Integrated Overview in LIST view
const summaryCardsRegex = /\{\/\* Summary Cards \*\/\}\s*<div className="flex gap-4 mb-6 justify-center">[\s\S]*?<\/div>\s*(?=\{\/\* Table \*\/\})/g;

const newOverviewComponent = `{/* TỔNG QUAN (Integrated KPIs) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Platform Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                <h3 className="text-[11px] font-bold text-gray-500 text-center mb-4 uppercase tracking-wider">SỐ LƯỢNG CONTENT MỖI NỀN TẢNG</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PLATFORM_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {PLATFORM_DATA.map((entry, index) => (
                          <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* KPI Results */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">HIỆU QUẢ CONTENT</h3>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Tổng bài viết</div>
                    <div className="text-xl font-bold text-gray-900">
                      {videos.filter(video => {
                        if (listTimeFilter === 'Tất cả') return true;
                        if (!video.dueDate) return false;
                        const date = new Date(video.dueDate);
                        const today = new Date();
                        if (listTimeFilter === 'Theo Tuần') return isSameWeek(date, today, { weekStartsOn: 1 });
                        if (listTimeFilter === 'Theo Tháng') return isSameMonth(date, today);
                        if (listTimeFilter === 'Theo Quý') return isSameQuarter(date, today);
                        if (listTimeFilter === 'Theo Năm') return isSameYear(date, today);
                        return true;
                      }).length}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {KPIS.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                      <div key={kpi.id} className="border border-gray-100 rounded-lg p-3 flex items-center gap-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-gray-100">
                          <Icon className="w-5 h-5 text-indigo-500 stroke-[2]" />
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">{kpi.name}</div>
                          <div className="text-lg font-bold text-gray-900">{kpi.current.toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Warning Signs */}
            <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <h2 className="text-sm font-bold text-red-900 uppercase tracking-wide">Warning Signs (Cảnh báo Kênh)</h2>
              </div>
              <div className="divide-y divide-red-50 bg-white grid grid-cols-1 md:grid-cols-2">
                <div className="p-4 flex items-start gap-3 hover:bg-red-50/30 transition-colors">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Quy trình tắc</h4>
                    <p className="text-xs text-gray-600 mt-1">2 tuần liên tiếp không đủ 3 video. <br/><span className="font-medium text-red-700">Hành động:</span> Họp khẩn, tìm bottleneck</p>
                  </div>
                </div>
                <div className="p-4 flex items-start gap-3 hover:bg-red-50/30 transition-colors border-l border-red-50 lg:border-l-0 border-t md:border-t-0">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Content không work</h4>
                    <p className="text-xs text-gray-600 mt-1">4 tuần không có video >2K view. <br/><span className="font-medium text-red-700">Hành động:</span> Đổi content pillar/hook</p>
                  </div>
                </div>
              </div>
            </div>

`;

content = content.replace(summaryCardsRegex, newOverviewComponent);

fs.writeFileSync(targetPath, content);
console.log("Updated MarketingApp.tsx successfully.");
