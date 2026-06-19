const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

// 1. Add useEffect for scroll
const useEffectImport = /import React, { .*?} from 'react'/;
if (content.match(useEffectImport)) {
    // Ensure useEffect is imported, usually it is.
}

const scrollEffect = `
    useEffect(() => {
        if (rightPaneRef.current && monthsData[0]) {
            // setTimeout to ensure layout has updated before scrolling
            setTimeout(() => {
                if (rightPaneRef.current) {
                    rightPaneRef.current.scrollLeft = monthsData[0].days * cellWidth;
                }
            }, 100);
        }
    }, [year, month, cellWidth]);

    const handleRightScroll = `;
content = content.replace('    const handleRightScroll = ', scrollEffect);


// 2. Replace Right Pane rendering

const rightPaneStart = '                        {/* Right Header */}';
const rightPaneEndString = '                        </div>\n                    </div>\n                </div>\n            </div>';

const rightPaneEndIndex = content.indexOf(rightPaneEndString);

if (rightPaneEndIndex !== -1) {
    const oldRightPaneContent = content.substring(content.indexOf(rightPaneStart), rightPaneEndIndex);

    const newRightPaneContent = `                        {/* Right Header */}
                        <div className="flex flex-col sticky top-0 z-30 shadow-sm min-h-[57px] bg-white">
                            {/* Month Level Header */}
                            <div className="flex border-b border-slate-200">
                                {monthsData.map((m) => (
                                    <div 
                                        key={\`m-\${m.year}-\${m.month}\`}
                                        className="flex items-center justify-center font-bold text-slate-700 text-xs border-r border-slate-200 bg-slate-100 py-1"
                                        style={{ width: \`\${m.days * cellWidth}px\` }}
                                    >
                                        {m.name}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Days Level Header */}
                            <div className="flex border-b border-slate-200">
                                {flatDays.map((d, idx) => (
                                    <div
                                        key={\`h-\${idx}\`}
                                        style={{ width: \`\${cellWidth}px\`, minWidth: \`\${cellWidth}px\` }}
                                        className={\`text-center flex flex-col items-center justify-center py-1 border-r border-slate-100 transition-colors \${isToday(d.day, d.month, d.year) ? 'bg-orange-500' :
                                            isWeekend(d.day, d.month, d.year) ? 'bg-slate-100/50' : 'bg-blue-50/50'
                                            }\`}
                                    >
                                        <div className={\`text-[11px] font-bold \${isToday(d.day, d.month, d.year) ? 'text-white' : 'text-slate-700'}\`}>{d.day}</div>
                                        <div className={\`text-[8px] font-bold uppercase tracking-tighter \${isToday(d.day, d.month, d.year) ? 'text-white/80' :
                                            isWeekend(d.day, d.month, d.year) ? 'text-red-400' : 'text-blue-400'
                                            }\`}>
                                            {getDayOfWeek(d.year, d.month, d.day)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Chart Rows */}
                        <div className="">
                            {ganttItems.length === 0 ? (
                                <div className="h-[200px]"></div> // Empty placeholder to align with left pane's 24 padding
                            ) : (
                                ganttItems.map((item) => {
                                    const progressAmount = item.task?.completion_pct || 0;

                                    return (
                                        <div key={item.id} className={\`flex border-b border-slate-200 hover:bg-slate-50 transition-colors h-9 group/row \${item.type === 'project' ? 'bg-[#e0e4db] hover:bg-[#d4d9ce]' : item.type === 'phase' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white'}\`}>
                                            
                                            {/* Timeline Grid (Right Side) */}
                                            <div className="flex-1 flex relative w-full h-full">
                                                {/* Background Grid Cells */}
                                                {flatDays.map((d, idx) => (
                                                    <div 
                                                        key={\`bg-\${idx}\`}
                                                        style={{ width: \`\${cellWidth}px\`, minWidth: \`\${cellWidth}px\` }}
                                                        className={\`border-r border-slate-200/50 \${isToday(d.day, d.month, d.year) ? 'bg-orange-500/10' : isWeekend(d.day, d.month, d.year) ? 'bg-slate-100/50' : ''}\`}
                                                    ></div>
                                                ))}

                                                {/* Colored Timeline Bar */}
                                                {item.startIndex !== null && item.duration > 0 && (
                                                    <div
                                                        style={{
                                                            left: \`\${item.startIndex * cellWidth}px\`,
                                                            width: \`\${item.duration * cellWidth}px\`
                                                        }}
                                                        className={\`absolute top-1 bottom-1 rounded-sm shadow-sm opacity-90 flex items-center transition-colors group/cell \${
                                                            item.type === 'project' ? 'bg-[#4a80bc]' : 
                                                            item.type === 'phase' ? 'bg-[#4a80bc]' : 
                                                            item.color // Usually bg-blue-500 or bg-slate-300
                                                        } \${item.type !== 'project' ? 'hover:brightness-95 cursor-grab active:cursor-grabbing' : ''}\`}
                                                        onMouseDown={(e) => {
                                                            if (item.type !== 'project') {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                const clickX = e.clientX - rect.left;
                                                                let action: 'move' | 'resize-left' | 'resize-right' = 'move';
                                                                
                                                                if (clickX < 10) action = 'resize-left';
                                                                else if (clickX > rect.width - 10) action = 'resize-right';
                                                                
                                                                setDraggingItem({ id: item.id, type: item.type, startX: e.clientX, deltaDays: 0, action });
                                                            }
                                                        }}
                                                        onDoubleClick={() => {
                                                            if (item.type === 'task') {
                                                                setEditingTask(item.task);
                                                                setIsEditModalOpen(true);
                                                            }
                                                        }}
                                                    >
                                                        {item.type !== 'project' && progressAmount > 0 && (
                                                            <span className="text-[8px] font-bold text-white/90 whitespace-nowrap z-10 select-none px-1 block truncate w-full text-center drop-shadow-md">
                                                                {progressAmount}%
                                                            </span>
                                                        )}
                                                        
                                                        {/* Resize handles */}
                                                        {item.type !== 'project' && (
                                                            <>
                                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 hover:cursor-col-resize z-20"></div>
                                                                <div className="absolute right-0 top-0 bottom-0 w-1.5 hover:cursor-col-resize z-20"></div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
`;

    content = content.replace(oldRightPaneContent, newRightPaneContent);
} else {
    console.log("Could not find Right Pane End Index");
}

fs.writeFileSync(ganttPath, content);
console.log('Phase 2 replacement complete.');
