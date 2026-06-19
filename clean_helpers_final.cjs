const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

// Remove all occurrences of the helper functions
c = c.replace(/const isToday = \([\s\S]*?now\.getFullYear\(\)\r?\n    \}/g, '');
c = c.replace(/const isTodayRow = \(\) => \{\r?\n        const now = new Date\(\)\r?\n        return month === now\.getMonth\(\) && year === now\.getFullYear\(\)\r?\n    \}/g, '');
c = c.replace(/const isWeekend = \([\s\S]*?d\.getDay\(\) === 6\r?\n    \}/g, '');
c = c.replace(/const getDayName = \([\s\S]*?DAY_NAMES\[d\.getDay\(\)\]\r?\n    \}/g, '');

// Clean up any remaining whitespace issues
c = c.replace(/\n\s*\n\s*\n/g, '\n\n');

// Insert the correct block right after `const month = currentDate.getMonth()`
const insertAfter = `const month = currentDate.getMonth()`;

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
    }`;

if (c.includes(insertAfter)) {
    c = c.replace(insertAfter, insertAfter + blockToInsert);
} else {
    console.log('Error: Could not find insertAfter target.');
}

fs.writeFileSync(path, c);
console.log('Cleaned up helpers.');
