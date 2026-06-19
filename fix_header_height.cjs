const fs = require('fs');
let c = fs.readFileSync('src/pages/gantt/Gantt.tsx', 'utf8');

c = c.replace(/className="flex flex-col sticky top-0 z-30 shadow-sm min-h-\[57px\] bg-white border-b border-slate-200"/g, 'className="flex flex-col sticky top-0 z-30 shadow-sm h-[66px] bg-white border-b border-slate-200 box-border"');

c = c.replace(/className="flex flex-col sticky top-0 z-30 shadow-sm min-h-\[57px\] bg-white"/g, 'className="flex flex-col sticky top-0 z-30 shadow-sm h-[66px] bg-white border-b border-slate-200 box-border"');

// Fix inner rows of the Right Header to fill the 66px evenly if needed, or just let them expand
c = c.replace(/className="flex border-b border-slate-200"/g, 'className="flex border-b border-slate-200 flex-1"');

fs.writeFileSync('src/pages/gantt/Gantt.tsx', c);
console.log('Fixed header heights');
