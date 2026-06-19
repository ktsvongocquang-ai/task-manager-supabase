const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Remove them from the outside
const blockToRemove = `    const isToday = (day: number) => {
        const now = new Date()
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
    }
    const isTodayRow = () => {
        const now = new Date()
        return month === now.getMonth() && year === now.getFullYear()
    }

    const isWeekend = (day: number) => {
        const d = new Date(year, month, day)
        return d.getDay() === 0 || d.getDay() === 6
    }

    const getDayName = (day: number) => {
        const d = new Date(year, month, day)
        return DAY_NAMES[d.getDay()]
    }
`;

c = c.replace(blockToRemove, '');

// 2. Insert them inside Gantt, right after `const month = currentDate.getMonth()`
const insertAfter = `    const month = currentDate.getMonth()`;

const blockToInsert = `
    const isToday = (day: number) => {
        const now = new Date()
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
    }
    const isTodayRow = () => {
        const now = new Date()
        return month === now.getMonth() && year === now.getFullYear()
    }
    const isWeekend = (day: number) => {
        const d = new Date(year, month, day)
        return d.getDay() === 0 || d.getDay() === 6
    }
    const getDayName = (day: number) => {
        const d = new Date(year, month, day)
        return DAY_NAMES[d.getDay()]
    }
`;

if (c.includes(insertAfter)) {
    c = c.replace(insertAfter, insertAfter + '\n' + blockToInsert);
} else {
    console.log('Error: Could not find insertAfter target.');
}

fs.writeFileSync(path, c);
console.log('Fixed helper functions scope.');
