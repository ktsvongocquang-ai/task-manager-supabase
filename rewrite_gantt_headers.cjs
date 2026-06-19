const fs = require('fs');

const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

const oldMonthHeader = `{/* Month Level Header */}
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
                            </div>`;

const newMonthHeader = `{/* Month Level Header */}
                            <div className="relative border-b border-slate-200" style={{ height: '25px', width: \`\${totalDays * cellWidth}px\` }}>
                                {monthsData.map((m, idx) => {
                                    const prevDays = monthsData.slice(0, idx).reduce((sum, prev) => sum + prev.days, 0);
                                    return (
                                        <div 
                                            key={\`m-\${m.year}-\${m.month}\`}
                                            className="absolute top-0 bottom-0 flex items-center justify-center font-bold text-slate-700 text-xs border-r border-slate-200 bg-slate-100"
                                            style={{ left: \`\${prevDays * cellWidth}px\`, width: \`\${m.days * cellWidth}px\` }}
                                        >
                                            {m.name}
                                        </div>
                                    );
                                })}
                            </div>`;

c = c.replace(oldMonthHeader, newMonthHeader);

const oldDaysHeader = `{/* Days Level Header */}
                            <div className="flex border-b border-slate-200 flex-1">
                                {flatDays.map((d, idx) => (
                                    <div
                                        key={\`h-\${idx}\`}
                                        style={{ width: \`\${cellWidth}px\`, minWidth: \`\${cellWidth}px\` }}
                                        className={\`text-center flex flex-col items-center justify-center py-1 border-r border-slate-100 transition-colors \${isToday3M(d.day, d.month, d.year) ? 'bg-orange-500' :
                                            isWeekend3M(d.day, d.month, d.year) ? 'bg-slate-100/50' : 'bg-blue-50/50'
                                            }\`}
                                    >
                                        <div className={\`text-[11px] font-bold \${isToday3M(d.day, d.month, d.year) ? 'text-white' : 'text-slate-700'}\`}>{d.day}</div>
                                        <div className={\`text-[8px] font-bold uppercase tracking-tighter \${isToday3M(d.day, d.month, d.year) ? 'text-white/80' :
                                            isWeekend3M(d.day, d.month, d.year) ? 'text-red-400' : 'text-blue-400'
                                            }\`}>
                                            {getDayOfWeek(d.year, d.month, d.day)}
                                        </div>
                                    </div>
                                ))}
                            </div>`;

const newDaysHeader = `{/* Days Level Header */}
                            <div className="relative border-b border-slate-200 flex-1" style={{ width: \`\${totalDays * cellWidth}px\` }}>
                                {flatDays.map((d, idx) => (
                                    <div
                                        key={\`h-\${idx}\`}
                                        style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }}
                                        className={\`absolute top-0 bottom-0 text-center flex flex-col items-center justify-center border-r border-slate-100 transition-colors \${isToday3M(d.day, d.month, d.year) ? 'bg-orange-500' :
                                            isWeekend3M(d.day, d.month, d.year) ? 'bg-slate-100/50' : 'bg-blue-50/50'
                                            }\`}
                                    >
                                        <div className={\`text-[11px] font-bold \${isToday3M(d.day, d.month, d.year) ? 'text-white' : 'text-slate-700'}\`}>{d.day}</div>
                                        <div className={\`text-[8px] font-bold uppercase tracking-tighter \${isToday3M(d.day, d.month, d.year) ? 'text-white/80' :
                                            isWeekend3M(d.day, d.month, d.year) ? 'text-red-400' : 'text-blue-400'
                                            }\`}>
                                            {getDayOfWeek(d.year, d.month, d.day)}
                                        </div>
                                    </div>
                                ))}
                            </div>`;

c = c.replace(oldDaysHeader, newDaysHeader);

fs.writeFileSync(path, c);
console.log('Successfully updated headers to use absolute positioning.');
