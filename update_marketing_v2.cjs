const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/pages/marketing/MarketingApp.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Fix Kanban overflow (add overflow-hidden to root div)
content = content.replace(
  '<div className="flex flex-col h-full bg-gray-50">',
  '<div className="flex flex-col h-full overflow-hidden bg-gray-50">'
);

// 2. Add New States
content = content.replace(
  /const \[listTimeFilter, setListTimeFilter\] = useState\('Tất cả'\);/g,
  `const [listTimeFilter, setListTimeFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [formatFilter, setFormatFilter] = useState('Tất cả');
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<typeof videos[0] | null>(null);`
);

// 3. Update the modal and X icon import if needed. We have X from lucide-react mostly, let's just make sure X is imported. Oh wait, MarketingApp imports: Plus, Search, Filter, MoreVertical, CalendarIcon, Video, FileText, CheckCircle2, Clock, AlertCircle, LayoutTemplate, Users, TrendingUp, Target, MessageCircle, GanttChartSquare. We need X. Let's add X to imports.
content = content.replace(
  /GanttChartSquare\n\} from 'lucide-react';/g,
  `GanttChartSquare,\n  X\n} from 'lucide-react';`
);

// 4. Update the "HIỆU QUẢ CONTENT" section to use dynamic KPIs
const kpiRenderSection = /{KPIS\.map\(kpi => \{[\s\S]*?\}\)}\s*<\/div>/g;

const filteredVideosStr = `const filteredVideos = videos.filter(video => {
                        if (listTimeFilter !== 'Tất cả') {
                          if (!video.dueDate) return false;
                          const date = new Date(video.dueDate);
                          const today = new Date();
                          if (listTimeFilter === 'Theo Tuần' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                          if (listTimeFilter === 'Theo Tháng' && !isSameMonth(date, today)) return false;
                          if (listTimeFilter === 'Theo Quý' && !isSameQuarter(date, today)) return false;
                          if (listTimeFilter === 'Theo Năm' && !isSameYear(date, today)) return false;
                        }
                        if (statusFilter !== 'Tất cả' && STATUS_MAP[video.status]?.name !== statusFilter) return false;
                        if (formatFilter !== 'Tất cả' && video.format !== formatFilter) return false;
                        return true;
                      });`;

const dynamicKpiLogic = `${filteredVideosStr}
                  {(() => {
                    const kpisToRender = [
                      { id: 'views', name: 'SỐ LƯỢT XEM', current: selectedVideo ? selectedVideo.views || 0 : filteredVideos.reduce((sum, v) => sum + (v.views || 0), 0), icon: TrendingUp },
                      { id: 'interactions', name: 'SỐ LƯỢT TƯƠNG TÁC', current: selectedVideo ? selectedVideo.interactions || 0 : filteredVideos.reduce((sum, v) => sum + (v.interactions || 0), 0), icon: Target },
                      { id: 'shares', name: 'SỐ LƯỢT CHIA SẺ', current: selectedVideo ? selectedVideo.shares || 0 : filteredVideos.reduce((sum, v) => sum + (v.shares || 0), 0), icon: MessageCircle },
                      { id: 'saves', name: 'SỐ LƯỢT LƯU LẠI', current: selectedVideo ? selectedVideo.saves || 0 : filteredVideos.reduce((sum, v) => sum + (v.saves || 0), 0), icon: CheckCircle2 },
                    ];
                    return kpisToRender.map(kpi => {
                      const Icon = kpi.icon;
                      return (
                        <div key={kpi.id} className="border border-indigo-100 rounded-xl p-4 flex items-center gap-4 bg-white/50 hover:bg-white shadow-sm hover:shadow-md transition-all">
                          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                            <Icon className="w-6 h-6 stroke-[2]" />
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase font-extrabold mb-1 tracking-wider">{kpi.name}</div>
                            <div className="text-2xl font-black text-gray-900 leading-none">{kpi.current.toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>`;
content = content.replace(kpiRenderSection, dynamicKpiLogic);


content = content.replace(/{videos\.filter\(video => \{[\s\S]*?\}\)\.length}/g, '{filteredVideos.length}');
// Oops, the top total post block needs 'filteredVideos' but 'filteredVideos' is declared in the JSX block. Let's just create 'filteredVideos' at the top of the LIST view.
// Wait, regex might be tricky if we don't do it before the whole LIST return block.

// Let's replace the whole `view === 'LIST' ? (` block to the bottom of the LIST view to re-render it.
// Actually, I can just write what I want using specific replace on sections.

// Let's replace the filter area
const filterAreaRegex = /\{\/\* Filter \*\/\}\s*<div className="flex justify-center mb-6">\s*<div className="inline-flex bg-gray-100 p-1 rounded-lg">[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(filterAreaRegex, `{/* Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                {['Tất cả', 'Theo Tuần', 'Theo Tháng', 'Theo Quý', 'Theo Năm'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setListTimeFilter(filter)}
                    className={\`px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${listTimeFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                 <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 shadow-sm">
                    <option value="Tất cả">Trạng thái: Tất cả</option>
                    {Object.values(STATUS_MAP).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                 </select>
                 <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 shadow-sm">
                    <option value="Tất cả">Định dạng: Tất cả</option>
                    <option value="Video ngắn">Video ngắn</option>
                    <option value="Video dài">Video dài</option>
                    <option value="Bài viết">Bài viết</option>
                    <option value="Ảnh">Ảnh</option>
                 </select>
              </div>
            </div>`);

// Update "HIỆU QUẢ CONTENT" header to show selection
const hieuQuaHeaderRegex = /<h3 className="text-\[11px\] font-bold text-gray-500 uppercase tracking-wider">HIỆU QUẢ CONTENT<\/h3>/g;
content = content.replace(
  hieuQuaHeaderRegex,
  `<h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center flex-wrap gap-2">
    HIỆU QUẢ CONTENT 
    {selectedVideo && (
      <span className="text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md normal-case flex items-center gap-1 font-semibold">
        Đang xem: <span className="max-w-[150px] truncate">{selectedVideo.title}</span>
        <button onClick={(e) => {e.stopPropagation(); setSelectedVideo(null)}} className="ml-1 text-indigo-400 hover:text-indigo-800 flex items-center"><X className="w-3 h-3"/></button>
      </span>
    )}
  </h3>`
);

// Define filteredVideos once in LIST view
content = content.replace(
  /<div className="min-w-max">/g,
  `<div className="min-w-max">
            {/* Compute filtered */}
            {(() => {
              const filteredVideos = videos.filter(video => {
                if (listTimeFilter !== 'Tất cả') {
                  if (!video.dueDate) return false;
                  const date = new Date(video.dueDate);
                  const today = new Date();
                  if (listTimeFilter === 'Theo Tuần' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                  if (listTimeFilter === 'Theo Tháng' && !isSameMonth(date, today)) return false;
                  if (listTimeFilter === 'Theo Quý' && !isSameQuarter(date, today)) return false;
                  if (listTimeFilter === 'Theo Năm' && !isSameYear(date, today)) return false;
                }
                if (statusFilter !== 'Tất cả' && STATUS_MAP[video.status]?.name !== statusFilter) return false;
                if (formatFilter !== 'Tất cả' && video.format !== formatFilter) return false;
                return true;
              });
              return (
                <div className="space-y-6">`
);
// Now we need to patch the end of the LIST view block to close these braces.
content = content.replace(
  /<\/div>\s*<\/div>\s*\) : view === 'CALENDAR' \? \(/g,
  `                </div>
              );
            })()}
          </div>
        </div>
      ) : view === 'CALENDAR' ? (`
);

// We need to change the inline \`videos.filter(...)\` inside the LIST view to \`filteredVideos\`
content = content.replace(/\{videos\.filter\([\s\S]*?\}\)\.length}/g, '{filteredVideos.length}');
// Also replace the tbody mapping filter with \`filteredVideos\`
content = content.replace(
  /<tbody className="divide-y divide-gray-200">\s*\{videos\.filter\([\s\S]*?\}\)\.map\(\(video\) => \{/g,
  `<tbody className="divide-y divide-gray-200">
                  {filteredVideos.map((video) => {`
);

// Remove headers
content = content.replace(/<th className="px-4 py-3 border-r border-gray-200">Nội dung<\/th>/g, '');
content = content.replace(/<th className="px-4 py-3 border-r border-gray-200">Hashtag<\/th>/g, '');
content = content.replace(/<th className="px-4 py-3 border-r border-gray-200">Ghi chú<\/th>/g, '');
content = content.replace(/<th className="px-4 py-3 border-r border-gray-200">Số lượt xem<\/th>/g, '');
content = content.replace(/<th className="px-4 py-3 border-r border-gray-200">Số lượt tương tác<\/th>/g, '');
content = content.replace(/<th className="px-4 py-3 border-r border-gray-200">Số lượt chia sẻ<\/th>/g, '');
content = content.replace(/<th className="px-4 py-3">Số lượt lưu lại<\/th>/g, '');


// Modify tr to have onClick
content = content.replace(
  /<tr key=\{video\.id\} className=\{\`\$\{rowColorClass\} transition-colors\`\}>/g,
  `<tr key={video.id} onClick={() => setSelectedVideo(video)} className={\`\${rowColorClass} transition-colors cursor-pointer \${selectedVideo?.id === video.id ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : ''}\`}>`
);

// Turn title cell into a button that sets showVideoModal
content = content.replace(
  /<td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-900 max-w-\[200px\] truncate" title=\{video\.title\}>\{video\.title\}<\/td>/g,
  `<td className="px-4 py-3 border-r border-gray-200 font-medium max-w-[200px] truncate" title={video.title}>
    <button onClick={(e) => {e.stopPropagation(); setShowVideoModal(video);}} className="text-left font-bold text-indigo-700 hover:text-indigo-500 hover:underline w-full truncate">
      {video.title}
    </button>
  </td>`
);

// Remove data cells
content = content.replace(/<td className="px-4 py-3 border-r border-gray-200 max-w-\[200px\] truncate text-gray-500" title=\{video\.contentDetails\}>[\s\S]*?<\/td>\s*<td className="px-4 py-3 border-r border-gray-200 text-blue-500">[\s\S]*?<\/td>\s*<td className="px-4 py-3 border-r border-gray-200">[\s\S]*?<\/td>\s*<td className="px-4 py-3 border-r border-gray-200 text-right font-medium">[\s\S]*?<\/td>\s*<td className="px-4 py-3 border-r border-gray-200 text-right font-medium">[\s\S]*?<\/td>\s*<td className="px-4 py-3 border-r border-gray-200 text-right font-medium">[\s\S]*?<\/td>\s*<td className="px-4 py-3 text-right font-medium">[\s\S]*?<\/td>/g, '');

// Append Modal UI at the end
const modalsBlock = `      {/* Modals */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 pr-4">{showVideoModal.title}</h3>
              <button onClick={() => setShowVideoModal(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trạng thái</span><div className="mt-1"><span className={\`px-2 py-1 rounded-md text-xs font-semibold \${STATUS_MAP[showVideoModal.status]?.color}\`}>{STATUS_MAP[showVideoModal.status]?.name}</span></div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Người thực hiện</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.assignee}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nền tảng</span><div className="mt-1 font-medium text-sm text-gray-900 flex items-center gap-1"><Video className="w-3 h-3 text-gray-400"/> {showVideoModal.platform}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Định dạng</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.format}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lịch đăng</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.dueDate ? format(new Date(showVideoModal.dueDate), 'dd/MM/yyyy') : '-'} {showVideoModal.publishTime}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mục tiêu</span><div className="mt-1 font-medium text-sm text-gray-900 flex items-center gap-1"><Target className="w-3 h-3 text-gray-400"/> {showVideoModal.goal || '-'}</div></div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nội dung chi tiết</span>
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{showVideoModal.contentDetails || 'Chưa có nội dung'}</div>
              </div>
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hashtag</span>
                  <div className="mt-1 text-sm font-medium text-indigo-600 bg-indigo-50/50 inline-block px-2 py-1 rounded-md border border-indigo-100/50">{showVideoModal.hashtags || '-'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ghi chú</span>
                  <div className="mt-1 text-sm text-gray-700 italic">{showVideoModal.notes || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <MarketingRequestModal`;
content = content.replace(/\{\/\* Modals \*\/\}\s*<MarketingRequestModal/g, modalsBlock);

fs.writeFileSync(targetPath, content);
console.log("Updated MarketingApp.tsx list view logic and Kanji layout successfully.");
