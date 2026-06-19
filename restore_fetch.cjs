const fs = require('fs');
const { execSync } = require('child_process');

const path = 'src/pages/gantt/Gantt.tsx';
let currentContent = fs.readFileSync(path, 'utf8');

// Get old content
const oldContent = execSync('git show a8c7efb:src/pages/gantt/Gantt.tsx', { encoding: 'utf8' });

// Extract fetchData block
const startStr = '    useEffect(() => {';
const endStr = '            setLoading(false)\r\n        }\r\n    }';
let endStr2 = '            setLoading(false)\n        }\n    }';

let startIdx = oldContent.indexOf(startStr);
let endIdx = oldContent.indexOf(endStr);
if (endIdx === -1) endIdx = oldContent.indexOf(endStr2);

if (startIdx !== -1 && endIdx !== -1) {
    const fetchDataBlock = oldContent.substring(startIdx, endIdx + endStr2.length);
    
    // Insert into current content right before visibleDates
    const insertTarget = '    const visibleDates = useMemo(() => {';
    if (currentContent.includes(insertTarget)) {
        currentContent = currentContent.replace(insertTarget, fetchDataBlock + '\n\n' + insertTarget);
        fs.writeFileSync(path, currentContent);
        console.log('Restored fetchData successfully.');
    } else {
        console.log('Error: Could not find insert target.');
    }
} else {
    console.log('Error: Could not find fetchData in old commit.');
}
