const fs = require('fs');
let c = fs.readFileSync('src/pages/gantt/Gantt.tsx', 'utf8');
c = c.replace(/ className="w-full h-\[calc\(100vh-140px\)\]/g, '    return (\n        <div className="w-full h-[calc(100vh-140px)]');
fs.writeFileSync('src/pages/gantt/Gantt.tsx', c);
