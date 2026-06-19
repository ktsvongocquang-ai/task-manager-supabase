const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

const blockToMove = `    useEffect(() => {
        if (rightPaneRef.current && monthsData[0]) {
            // setTimeout to ensure layout has updated before scrolling
            setTimeout(() => {
                if (rightPaneRef.current) {
                    rightPaneRef.current.scrollLeft = monthsData[0].days * cellWidth;
                }
            }, 100);
        }
    }, [year, month, cellWidth]);

    const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!isSyncingRightScroll.current) {
            isSyncingLeftScroll.current = true;
            if (leftPaneRef.current) {
                leftPaneRef.current.scrollTop = e.currentTarget.scrollTop;
            }
        }
        isSyncingRightScroll.current = false;
    };`;

if (content.includes(blockToMove)) {
    // Remove it from its current position
    content = content.replace(blockToMove, '');

    // Insert it just before the return statement
    const returnRegex = /^(\s*return \(\s*<div)/m;
    content = content.replace(returnRegex, (match) => blockToMove + '\n\n' + match);

    fs.writeFileSync(ganttPath, content);
    console.log('TDZ fix complete.');
} else {
    console.log('Block not found. Check for CRLF differences.');
}
