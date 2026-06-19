const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

// Replace refs
c = c.replace(/const leftPaneRef = useRef<HTMLDivElement>\(null\);/g, 'const scrollContainerRef = useRef<HTMLDivElement>(null);');
c = c.replace(/const rightPaneRef = useRef<HTMLDivElement>\(null\);/g, '');
c = c.replace(/const isSyncingLeft = useRef\(false\);/g, '');
c = c.replace(/const isSyncingRight = useRef\(false\);/g, '');

// Remove handleLeftScroll and handleRightScroll
c = c.replace(/const handleLeftScroll = [\s\S]*?isSyncingLeft\.current = false;\n    };/g, '');
c = c.replace(/const handleRightScroll = [\s\S]*?isSyncingRight\.current = false;\n    };/g, '');

// Update scrollToToday
c = c.replace(/if \(!rightPaneRef\.current\) return;/g, 'if (!scrollContainerRef.current) return;');
c = c.replace(/rightPaneRef\.current\.scrollTo/g, 'scrollContainerRef.current.scrollTo');
c = c.replace(/rightPaneRef\.current\.clientWidth \/ 2/g, '(scrollContainerRef.current.clientWidth - 420) / 2');

fs.writeFileSync(path, c);
console.log('Refs updated!');
