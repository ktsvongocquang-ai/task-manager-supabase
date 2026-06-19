const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

// 1. Update the Left Pane width and add overflow-x-scroll
content = content.replace(
    'className="w-[600px] flex-shrink-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex flex-col overflow-y-auto"',
    'className="w-[420px] flex-shrink-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex flex-col overflow-y-auto overflow-x-scroll"'
);

// 2. Update Header widths
content = content.replace(
    'className="w-[300px] px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center bg-slate-50"',
    'className="w-[200px] px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center bg-slate-50"'
);
content = content.replace(
    'className="w-[100px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50"',
    'className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50"'
);
content = content.replace( // Second match for Kết Thúc
    'className="w-[100px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50"',
    'className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50"'
);
content = content.replace(
    'className="w-[50px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center bg-slate-50"',
    'className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center bg-slate-50"'
);
content = content.replace(
    'className="w-[50px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center justify-center bg-slate-50"',
    'className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center justify-center bg-slate-50"'
);

// 3. Update Row widths
content = content.replace(
    'className="w-[300px] px-3 py-2 border-r border-slate-200 flex-shrink-0 flex flex-col justify-center relative"',
    'className="w-[200px] px-3 py-2 border-r border-slate-200 flex-shrink-0 flex flex-col justify-center relative"'
);
content = content.replace(
    'className={`w-[100px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px]',
    'className={`w-[70px] px-1 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px]'
);
content = content.replace( // Second match
    'className={`w-[100px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px]',
    'className={`w-[70px] px-1 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px]'
);
content = content.replace(
    'className={`w-[50px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px]',
    'className={`w-[40px] px-1 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px]'
);
content = content.replace(
    'className={`w-[50px] px-2 py-2 flex-shrink-0 flex items-center justify-center text-[10px]',
    'className={`w-[40px] px-1 py-2 flex-shrink-0 flex items-center justify-center text-[10px]'
);

// 4. Fix out of bounds rendering bug for phases
const phaseBugStart = `                    if (phaseEndDate.getFullYear() === year && phaseEndDate.getMonth() === month) {
                        renderEndDay = phaseEndDate.getDate();
                    } else if (phaseEndDate > new Date(year, month + 1, 0)) {
                        renderEndDay = daysInMonth;
                    }`;
const phaseBugFix = `                    if (phaseEndDate.getFullYear() === year && phaseEndDate.getMonth() === month) {
                        renderEndDay = phaseEndDate.getDate();
                    } else if (phaseEndDate > new Date(year, month + 1, 0)) {
                        renderEndDay = daysInMonth;
                    }
                    
                    if (phaseEndDate < new Date(year, month, 1) || currentPhaseStartDate > new Date(year, month + 1, 0)) {
                         renderStartDay = null;
                         renderEndDay = null;
                    }`;
content = content.replace(phaseBugStart, phaseBugFix);

// 5. Fix out of bounds rendering bug for tasks
const taskBugStart = `                            if (tEnd && tEnd.getFullYear() === year && tEnd.getMonth() === month) {
                                tRenderEndDay = tEnd.getDate();
                            } else if (tEnd && tEnd > new Date(year, month + 1, 0)) {
                                tRenderEndDay = daysInMonth;
                            }`;
const taskBugFix = `                            if (tEnd && tEnd.getFullYear() === year && tEnd.getMonth() === month) {
                                tRenderEndDay = tEnd.getDate();
                            } else if (tEnd && tEnd > new Date(year, month + 1, 0)) {
                                tRenderEndDay = daysInMonth;
                            }

                            if (tStart && tEnd && (tEnd < new Date(year, month, 1) || tStart > new Date(year, month + 1, 0))) {
                                 tRenderStartDay = null;
                                 tRenderEndDay = null;
                            }`;
content = content.replace(taskBugStart, taskBugFix);

fs.writeFileSync(ganttPath, content);
console.log('Update script completed.');
