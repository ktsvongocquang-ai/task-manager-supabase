const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
`    const leftPaneRef = useRef<HTMLDivElement>(null)
    const rightPaneRef = useRef<HTMLDivElement>(null)
    const isSyncingLeftScroll = useRef(false)
    const isSyncingRightScroll = useRef(false)

    const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!isSyncingLeftScroll.current) {
            isSyncingRightScroll.current = true;
            if (rightPaneRef.current) {
                rightPaneRef.current.scrollTop = e.currentTarget.scrollTop;
            }
        }
        isSyncingLeftScroll.current = false;
    };`,
`    const scrollContainerRef = useRef<HTMLDivElement>(null)`
);

c = c.replace(
`    const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!isSyncingRightScroll.current) {
            isSyncingLeftScroll.current = true;
            if (leftPaneRef.current) {
                leftPaneRef.current.scrollTop = e.currentTarget.scrollTop;
            }
        }
        isSyncingRightScroll.current = false;
    };`,
``
);

fs.writeFileSync(path, c);
console.log('Fixed refs');
