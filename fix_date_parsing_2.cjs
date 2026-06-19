const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace("const startDates = validTasks.map(t => t.start_date ? new Date(t.start_date).getTime() : new Date(t.due_date!).getTime())", "const startDates = validTasks.map(t => t.start_date ? parseDateStr(t.start_date)!.getTime() : parseDateStr(t.due_date!)!.getTime())");
c = c.replace("const endDates = validTasks.map(t => t.due_date ? new Date(t.due_date).getTime() : new Date(t.start_date!).getTime())", "const endDates = validTasks.map(t => t.due_date ? parseDateStr(t.due_date)!.getTime() : parseDateStr(t.start_date!)!.getTime())");

c = c.replace("const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '';", "const sDate = parseDateStr(item.startDate); const formattedStart = sDate ? format(sDate, 'dd/MM/yyyy') : '';");
c = c.replace("const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '';", "const eDate = parseDateStr(item.endDate); const formattedEnd = eDate ? format(eDate, 'dd/MM/yyyy') : '';");
c = c.replace("const totalDays = (item.startDate && item.endDate) ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;", "const totalDays = (sDate && eDate) ? Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;");

// Fix any leftover new Date(item.startDate) in Gantt.tsx
c = c.replace("const newEnd = new Date(item.startDate);", "const newEnd = parseDateStr(item.startDate);");

fs.writeFileSync(path, c);
console.log('Fixed more dates!');
