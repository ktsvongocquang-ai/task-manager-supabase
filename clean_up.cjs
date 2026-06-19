const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/const leftPaneRef = useRef<HTMLDivElement>\(null\)/g, 'const scrollContainerRef = useRef<HTMLDivElement>(null)');
c = c.replace(/const rightPaneRef = useRef<HTMLDivElement>\(null\)/g, '');
c = c.replace(/const isSyncingLeftScroll = useRef\(false\)/g, '');
c = c.replace(/const isSyncingRightScroll = useRef\(false\)/g, '');

c = c.replace(/const handleLeftScroll = \([\s\S]*?isSyncingLeftScroll\.current = false;\r?\n    };/g, '');
c = c.replace(/const handleRightScroll = \([\s\S]*?isSyncingRightScroll\.current = false;\r?\n    };/g, '');

c = c.replace(/onClick=\{\(e\) => \{ setTaskPanelMode\('phase'\); setSelectedItem\(item\); \}\}/g, `onDoubleClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (item.type === 'task' || item.type === 'phase') {
                                                                if (item.task) {
                                                                    setEditingTask(item.task); 
                                                                    setIsEditModalOpen(true); 
                                                                }
                                                            }
                                                        }}`);

c = c.replace(/onClick=\{\(\) => \{ setTaskPanelMode\(item\.type === 'project' \? 'project' : 'phase'\); setSelectedItem\(item\); \}\}/g, '');

c = c.replace(/const totalDays = monthsData\.reduce\(\(sum, m\) => sum \+ m\.days, 0\);/g, 'const totalDays = daysInMonth;');

c = c.replace(/useEffect\(\(\) => \{\r?\n        if \(scrollContainerRef\.current && monthsData\[0\]\) \{\r?\n            setTimeout\(\(\) => \{\r?\n                if \(scrollContainerRef\.current\) \{\r?\n                    scrollContainerRef\.current\.scrollLeft = monthsData\[0\]\.days \* cellWidth;\r?\n                \}\r?\n            \}, 100\);\r?\n        \}\r?\n    \}, \[year, month, cellWidth\]\);/g, '');

fs.writeFileSync(path, c);
console.log('Fixed refs');
