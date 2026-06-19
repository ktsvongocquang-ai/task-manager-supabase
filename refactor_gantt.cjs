const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add viewMode state
c = c.replace(/const \[zoom, setZoom\] = useState\(100\)/, "const [zoom, setZoom] = useState(100)\n    const [viewMode, setViewMode] = useState<'month' | 'week'>('week')");

// 2. Replace date generation and helper logic
const oldLogicStart = c.indexOf('const year = currentDate.getFullYear()');
const oldLogicEnd = c.indexOf('const prevMonth = () =>');
if (oldLogicStart !== -1 && oldLogicEnd !== -1) {
    const newLogic = `
    const visibleDates = useMemo(() => {
        const result = [];
        if (viewMode === 'month') {
            const y = currentDate.getFullYear();
            const m = currentDate.getMonth();
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                result.push(new Date(y, m, i, 0, 0, 0));
            }
        } else {
            const d = new Date(currentDate);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0);
            for (let i = 0; i < 7; i++) {
                const nextDay = new Date(monday);
                nextDay.setDate(monday.getDate() + i);
                result.push(nextDay);
            }
        }
        return result;
    }, [currentDate, viewMode]);

    const totalDays = visibleDates.length;

    const isToday = (d: Date) => {
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    const getDayName = (d: Date) => DAY_NAMES[d.getDay()];

    const parseDateStr = (dateStr?: string | null) => {
        if (!dateStr) return null;
        return new Date(dateStr);
    };

    const getTimelineRange = (start: Date | null, end: Date | null) => {
        if (!start || !end) return null;
        if (visibleDates.length === 0) return null;
        
        const firstVisible = visibleDates[0];
        const lastVisible = visibleDates[visibleDates.length - 1];

        // Normalize hours for accurate comparison
        const s = new Date(start); s.setHours(0,0,0,0);
        const e = new Date(end); e.setHours(23,59,59,999);
        const f = new Date(firstVisible); f.setHours(0,0,0,0);
        const l = new Date(lastVisible); l.setHours(23,59,59,999);

        if (e < f || s > l) return null;

        let startIndex = 0;
        let endIndex = visibleDates.length - 1;

        for (let i = 0; i < visibleDates.length; i++) {
            if (visibleDates[i].getTime() >= s.getTime()) {
                startIndex = i;
                break;
            }
        }
        if (s.getTime() < f.getTime()) startIndex = 0;

        for (let i = visibleDates.length - 1; i >= 0; i--) {
            if (visibleDates[i].getTime() <= e.getTime()) {
                endIndex = i;
                break;
            }
        }
        if (e.getTime() > l.getTime()) endIndex = visibleDates.length - 1;

        return { startIndex, duration: Math.max(1, endIndex - startIndex + 1) };
    };

    `;
    c = c.substring(0, oldLogicStart) + newLogic + c.substring(oldLogicEnd);
} else {
    console.log('Error: Could not find logic replacement boundaries.');
}

// 3. Update Navigation logic
const navStart = c.indexOf('const prevMonth = () =>');
const navEnd = c.indexOf('const filteredProjectsBase =');
if (navStart !== -1 && navEnd !== -1) {
    const newNav = `
    const navigatePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        setCurrentDate(newDate);
    }
    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        setCurrentDate(newDate);
    }
    const resetDate = () => setCurrentDate(new Date())

    `;
    c = c.substring(0, navStart) + newNav + c.substring(navEnd);
}

// 4. Update the View Controls in the UI
c = c.replace(
    `<div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={resetMonth} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-medium flex items-center gap-2 text-sm border border-slate-200">
                                <Calendar size={16} />
                                Hôm nay
                            </button>
                            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                                <ChevronRight size={20} />
                            </button>
                        </div>`,
    `<div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                <button onClick={() => setViewMode('month')} className={\`px-3 py-1 text-sm font-medium rounded-md transition-colors \${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}\`}>Tháng</button>
                                <button onClick={() => setViewMode('week')} className={\`px-3 py-1 text-sm font-medium rounded-md transition-colors \${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}\`}>Tuần</button>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={navigatePrev} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={resetDate} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-medium flex items-center gap-2 text-sm border border-slate-200">
                                    <Calendar size={16} />
                                    Hôm nay
                                </button>
                                <button onClick={navigateNext} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>`
);

// 5. Update Grid Headers
c = c.replace(
    `<div className="flex items-center justify-center font-bold text-slate-700 text-xs border-b border-slate-200 bg-slate-100" style={{ height: '25px', width: \`\${totalDays * cellWidth}px\` }}>
                                    Tháng {month + 1} 2026
                                </div>
                                {/* Days Label */}
                                <div className="relative flex-1" style={{ width: \`\${totalDays * cellWidth}px\` }}>
                                    {days.map((d, idx) => (
                                        <div key={idx} className={\`absolute top-0 bottom-0 text-center flex flex-col items-center justify-center border-r border-slate-100 transition-colors \${isToday(d) ? 'bg-orange-500' : isWeekend(d) ? 'bg-slate-100/50' : 'bg-blue-50/50'}\`} style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }}>
                                            <div className={\`text-[11px] font-bold \${isToday(d) ? 'text-white' : 'text-slate-700'}\`}>{d}</div>
                                            <div className={\`text-[8px] font-bold uppercase tracking-tighter \${isToday(d) ? 'text-white/80' : isWeekend(d) ? 'text-red-400' : 'text-blue-400'}\`}>{getDayName(d)}</div>
                                        </div>
                                    ))}
                                </div>`,
    `{/* Dynamic Header Label */}
                                <div className="flex items-center justify-center font-bold text-slate-700 text-xs border-b border-slate-200 bg-slate-100" style={{ height: '25px', width: \`\${totalDays * cellWidth}px\` }}>
                                    {viewMode === 'month' ? \`Tháng \${visibleDates[0]?.getMonth() + 1} \${visibleDates[0]?.getFullYear()}\` : \`Tuần \${Math.ceil((visibleDates[0]?.getDate() - 1) / 7) + 1} Tháng \${visibleDates[0]?.getMonth() + 1} (\${format(visibleDates[0] || new Date(), 'dd/MM')} - \${format(visibleDates[6] || new Date(), 'dd/MM')})\`}
                                </div>
                                {/* Days Label */}
                                <div className="relative flex-1" style={{ width: \`\${totalDays * cellWidth}px\` }}>
                                    {visibleDates.map((d, idx) => (
                                        <div key={idx} className={\`absolute top-0 bottom-0 text-center flex flex-col items-center justify-center border-r border-slate-200 transition-colors \${isToday(d) ? 'bg-orange-500' : isWeekend(d) ? 'bg-slate-100/50' : 'bg-blue-50/50'}\`} style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }}>
                                            <div className={\`text-[11px] font-bold \${isToday(d) ? 'text-white' : 'text-slate-700'}\`}>{d.getDate()}</div>
                                            <div className={\`text-[8px] font-bold uppercase tracking-tighter \${isToday(d) ? 'text-white/80' : isWeekend(d) ? 'text-red-400' : 'text-blue-400'}\`}>{getDayName(d)}</div>
                                        </div>
                                    ))}
                                </div>`
);

// 6. Fix the Background Grid to Overlay Grid (caro)
c = c.replace(
    `{/* Background Grid */}
                                                {days.map((d, idx) => (
                                                    <div 
                                                        key={\`bg-\${idx}\`} 
                                                        className={\`absolute top-0 bottom-0 border-r border-slate-100/50 pointer-events-none \${isWeekend(d) ? 'bg-slate-50/50' : ''}\`} 
                                                        style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }} 
                                                    />
                                                ))}`,
    `{/* Background Weekend Shading (UNDER bars) */}
                                                {visibleDates.map((d, idx) => (
                                                    isWeekend(d) ? <div key={\`bg-\${idx}\`} className="absolute top-0 bottom-0 pointer-events-none bg-slate-50/50" style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }} /> : null
                                                ))}`
);

// Remove the today line inside row (optional, but keep it for now)
c = c.replace(
    `{isTodayRow() && (
                                                    <div 
                                                        className="absolute top-0 bottom-0 border-l-2 border-orange-500/50 pointer-events-none z-10"
                                                        style={{ left: \`\${(new Date().getDate() - 1) * cellWidth + (cellWidth / 2)}px\` }}
                                                    />
                                                )}`,
    ``
);

// Add the Grid Overlay (OVER bars)
const cellEnd = c.indexOf('{/* Today Line inside Row */}');
if (cellEnd !== -1) {
    const gridOverlay = `
                                                {/* Grid Lines Overlay (OVER bars) - CARO EFFECT */}
                                                <div className="absolute inset-0 pointer-events-none z-20">
                                                    {visibleDates.map((d, idx) => (
                                                        <div key={\`grid-\${idx}\`} className="absolute top-0 bottom-0 border-r border-slate-300" style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }} />
                                                    ))}
                                                </div>
                                                
                                                {/* Today Line inside Row */}
                                                {(() => {
                                                    const todayIdx = visibleDates.findIndex(d => isToday(d));
                                                    if (todayIdx !== -1) {
                                                        return (
                                                            <div 
                                                                className="absolute top-0 bottom-0 border-l-2 border-orange-500/80 pointer-events-none z-30"
                                                                style={{ left: \`\${todayIdx * cellWidth + (cellWidth / 2)}px\` }}
                                                            />
                                                        )
                                                    }
                                                    return null;
                                                })()}
    `;
    c = c.substring(0, cellEnd) + gridOverlay + c.substring(c.indexOf('</div>\n                                        </div>\n                                    );', cellEnd));
}

// 7. Make Gantt Bars solid (not translucent)
c = c.replace(/bg-\[#4a80bc\]\/60/g, 'bg-[#4a80bc]');
c = c.replace(/border-\[#3a689b\]\/60/g, 'border-[#3a689b]');
c = c.replace(/bg-emerald-500\/60/g, 'bg-emerald-500');
c = c.replace(/border-emerald-600\/60/g, 'border-emerald-600');
c = c.replace(/bg-\[#5da0ea\]\/60/g, 'bg-[#5da0ea]');
c = c.replace(/border-\[#4b82c3\]\/60/g, 'border-[#4b82c3]');
c = c.replace(/bg-slate-400\/30/g, 'bg-slate-300'); // make expected bar solid but distinct

// Fix 'cellWidth' logic to zoom in Week Mode automatically (optional, but let's keep it manual)

fs.writeFileSync(path, c);
console.log('Refactoring complete.');
