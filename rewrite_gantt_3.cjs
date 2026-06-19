const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

const injectedLogic = `
    const prevMonthDate = new Date(year, month - 1, 1);
    const currentMonthDate = new Date(year, month, 1);
    const nextMonthDate = new Date(year, month + 1, 1);

    const monthsData = useMemo(() => [prevMonthDate, currentMonthDate, nextMonthDate].map(d => ({
        year: d.getFullYear(),
        month: d.getMonth(),
        days: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
        name: \`Tháng \${d.getMonth() + 1} \${d.getFullYear()}\`
    })), [year, month]);

    const totalDays = monthsData.reduce((sum, m) => sum + m.days, 0);

    const flatDays = useMemo(() => {
        const arr: any[] = [];
        monthsData.forEach(m => {
            for (let i = 1; i <= m.days; i++) {
                arr.push({ day: i, month: m.month, year: m.year });
            }
        });
        return arr;
    }, [monthsData]);

    const timelineStart = new Date(year, month - 1, 1);
    const timelineEnd = new Date(year, month + 2, 0, 23, 59, 59);

    const getDayIndex = (date: Date) => {
        let index = 0;
        for (let i = 0; i < monthsData.length; i++) {
            const m = monthsData[i];
            if (date.getFullYear() === m.year && date.getMonth() === m.month) {
                return index + date.getDate() - 1;
            }
            if (date > new Date(m.year, m.month, m.days, 23, 59, 59)) {
                index += m.days;
            }
        }
        return index;
    };

    const getTimelineRange = (start: Date | null, end: Date | null) => {
        if (!start || !end) return null;
        if (end < timelineStart || start > timelineEnd) return null;

        let startIndex = 0;
        if (start >= timelineStart) {
            startIndex = getDayIndex(start);
        }

        let endIndex = totalDays - 1;
        if (end <= timelineEnd) {
            endIndex = getDayIndex(end);
        }

        return { startIndex, duration: Math.max(1, endIndex - startIndex + 1) };
    };

    const getDayOfWeek = (y: number, m: number, d: number) => {
        return DAY_NAMES[new Date(y, m, d).getDay()]
    }

    // Overload isToday and isWeekend for the new 3-month logic
    const isToday3M = (day: number, m: number, y: number) => {
        const now = new Date()
        return day === now.getDate() && m === now.getMonth() && y === now.getFullYear()
    }

    const isWeekend3M = (day: number, m: number, y: number) => {
        const d = new Date(y, m, day)
        return d.getDay() === 0 || d.getDay() === 6
    }
`;

const anchorRegex = /const getDayName = \(day: number\) => \{[\s\S]*?return DAY_NAMES\[d\.getDay\(\)\]\r?\n\s*\}/;

if (anchorRegex.test(content)) {
    content = content.replace(anchorRegex, (match) => match + '\n' + injectedLogic);
    fs.writeFileSync(ganttPath, content);
    console.log('Phase 3 replacement complete.');
} else {
    console.log("Regex Anchor not found!");
}
