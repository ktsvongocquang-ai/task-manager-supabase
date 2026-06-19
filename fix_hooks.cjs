const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

const hookRegex = /^\s*useEffect\(\(\) => \{\r?\n\s*if \(rightPaneRef\.current && monthsData\[0\]\) \{[\s\S]*?isSyncingRightScroll\.current = false;\r?\n\s*\};\r?\n/m;
const match = content.match(hookRegex);

if (match) {
    content = content.replace(hookRegex, '');
    const targetRegex = /^(\s*if \(loading\) \{)/m;
    content = content.replace(targetRegex, (target) => match[0] + '\n' + target);
    fs.writeFileSync(ganttPath, content);
    console.log('React Hooks Order fixed!');
} else {
    console.log('Hook block not found!');
}
