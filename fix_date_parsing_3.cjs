const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace("const phaseStart = phase.startDate ? format(new Date(phase.startDate), 'dd/MM') : '';", "const phaseStart = phase.startDate ? format(parseDateStr(phase.startDate)!, 'dd/MM') : '';");
c = c.replace("const phaseEnd = phase.endDate ? format(new Date(phase.endDate), 'dd/MM') : '';", "const phaseEnd = phase.endDate ? format(parseDateStr(phase.endDate)!, 'dd/MM') : '';");

fs.writeFileSync(path, c);
console.log('Fixed final dates!');
