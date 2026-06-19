const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

content = content.replace(
    '<div className="space-y-6 max-w-[1400px] mx-auto pb-10">',
    '<div className="w-full h-[calc(100vh-140px)] flex flex-col space-y-4 pb-4">'
);

content = content.replace(
    '<div className="hidden md:flex bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">',
    '<div className="hidden md:flex flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">'
);

content = content.replace(
    "style={{ maxHeight: '600px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}",
    "style={{ height: '100%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}"
);

content = content.replace(
    "style={{ maxHeight: '600px' }}",
    "style={{ height: '100%' }}"
);

fs.writeFileSync(ganttPath, content);
console.log('Update script completed.');
