const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('const parseDateStr')) {
    const fnDef = `    const parseDateStr = (dateStr: string | null): Date | null => {
        if (!dateStr) return null;
        if (dateStr.includes('T')) return new Date(dateStr);
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}T00:00:00\`);
            }
        }
        return new Date(dateStr);
    };

    const getTimelineRange`;
    c = c.replace('    const getTimelineRange', fnDef);
}

// Global replacements
c = c.replaceAll('const startDates = validTasks.map(t => t.start_date ? new Date(t.start_date).getTime() : new Date(t.due_date!).getTime())', 'const startDates = validTasks.map(t => t.start_date ? parseDateStr(t.start_date)!.getTime() : parseDateStr(t.due_date!)!.getTime())');
c = c.replaceAll('const endDates = validTasks.map(t => t.due_date ? new Date(t.due_date).getTime() : new Date(t.start_date!).getTime())', 'const endDates = validTasks.map(t => t.due_date ? parseDateStr(t.due_date)!.getTime() : parseDateStr(t.start_date!)!.getTime())');

c = c.replaceAll('const start = startDate ? new Date(startDate) : null;', 'const start = parseDateStr(startDate);');
c = c.replaceAll('const end = endDate ? new Date(endDate) : null;', 'const end = parseDateStr(endDate);');

c = c.replaceAll('let currentPhaseStartDate = p.start_date ? new Date(p.start_date) : new Date();', 'let currentPhaseStartDate = p.start_date ? parseDateStr(p.start_date)! : new Date();');

c = c.replaceAll('const tStart = t.start_date ? new Date(t.start_date) : null;', 'const tStart = parseDateStr(t.start_date);');
c = c.replaceAll('const tEnd = t.due_date ? new Date(t.due_date) : null;', 'const tEnd = parseDateStr(t.due_date);');

c = c.replaceAll('const newEnd = new Date(item.startDate);', 'const newEnd = parseDateStr(item.startDate);');

c = c.replaceAll("const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '';", "const sDate = parseDateStr(item.startDate); const formattedStart = sDate ? format(sDate, 'dd/MM/yyyy') : '';");
c = c.replaceAll("const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '';", "const eDate = parseDateStr(item.endDate); const formattedEnd = eDate ? format(eDate, 'dd/MM/yyyy') : '';");
c = c.replaceAll("const totalDays = (item.startDate && item.endDate) ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;", "const totalDays = (sDate && eDate) ? Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;");

c = c.replaceAll("{item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : 'Chưa có'}", "{item.startDate ? format(parseDateStr(item.startDate)!, 'dd/MM/yyyy') : 'Chưa có'}");
c = c.replaceAll("{item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : 'Chưa có'}", "{item.endDate ? format(parseDateStr(item.endDate)!, 'dd/MM/yyyy') : 'Chưa có'}");

c = c.replaceAll("handleCellClick(item, 'start_date', item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', e)", "handleCellClick(item, 'start_date', item.startDate ? parseDateStr(item.startDate)!.toISOString().split('T')[0] : '', e)");
c = c.replaceAll("handleCellClick(item, 'end_date', item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '', e)", "handleCellClick(item, 'end_date', item.endDate ? parseDateStr(item.endDate)!.toISOString().split('T')[0] : '', e)");

c = c.replaceAll("const phaseStart = phase.startDate ? format(new Date(phase.startDate), 'dd/MM') : '';", "const phaseStart = phase.startDate ? format(parseDateStr(phase.startDate)!, 'dd/MM') : '';");
c = c.replaceAll("const phaseEnd = phase.endDate ? format(new Date(phase.endDate), 'dd/MM') : '';", "const phaseEnd = phase.endDate ? format(parseDateStr(phase.endDate)!, 'dd/MM') : '';");

fs.writeFileSync(path, c);
console.log('Fixed EVERYTHING!');
