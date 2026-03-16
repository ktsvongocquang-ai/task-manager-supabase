const fs = require('fs');
const file = 'src/pages/marketing/MarketingApp.tsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const startMarker = `                      {activeVideos.map(video => {
                        const statusDef = STATUS_MAP[video.status];
                        const isExpanded = expandedCards[video.id];
                        const isIdeaCol = column.id === 'COL_IDEA';`;

const endMarker = `                            )}
                          </div>
                        );
                      })}`;

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Could not find start marker");
  process.exit(1);
}

const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;
if (content.indexOf(endMarker, startIndex) === -1) {
  console.error("Could not find end marker");
  process.exit(1);
}

const originalBlock = content.slice(startIndex, endIndex);

const replacement = `                      {activeVideos.map(video => {
                        const task = video;
                        const assignee = profiles.find(p => p.id === task.assignee_id);
                        
                        return (
                          <div 
                            key={task.id} 
                            onClick={() => {
                                setEditingTask(task);
                                setIsTaskModalOpen(true);
                            }}
                            className="bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer group flex flex-col border-slate-200 hover:border-[#5B5FC7]/30 hover:shadow-md"
                          >
                                <div className="flex justify-between items-start mb-1.5 gap-2">
                                    <h4 className="font-bold text-slate-800 text-[14px] leading-tight group-hover:text-[#5B5FC7] transition-colors line-clamp-2 flex-1">
                                        {task.title}
                                    </h4>
                                    <span className={\`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 max-h-[22px] flex items-center \${task.priority === 'Khẩn cấp' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' :
                                        task.priority === 'Cao' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            task.priority === 'Trung bình' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                        }\`}>
                                        {task.priority || 'Trung bình'}
                                    </span>
                                </div>

                                <div className="text-[10px] font-medium text-slate-400 tracking-tight mb-3">
                                    {task.task_code || task.id}
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-2 mb-3.5 overflow-hidden">
                                    <div className="bg-[#5B5FC7] h-2 rounded-full transition-all" style={{ width: \`\${task.completion_pct || 0}%\` }}></div>
                                </div>

                                <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        {task.dueDate && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                <Calendar size={10} className="text-slate-400" />
                                                {format(new Date(task.dueDate), 'dd/MM')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 min-h-[32px] bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[9px] font-bold text-indigo-700" title={assignee?.full_name || task.assignee || 'Chưa gán'}>
                                            {(assignee?.full_name || task.assignee || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[80px]">
                                            {(assignee?.full_name || task.assignee || 'Chưa gán').split(' ').pop()}
                                        </span>
                                    </div>
                                </div>
                          </div>
                        );
                      })}`;

content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(file, content);
console.log("Successfully patched MarketingApp.tsx");
