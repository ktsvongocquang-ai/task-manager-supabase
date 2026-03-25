const fs = require('fs');
const { execSync } = require('child_process');

function restoreLines() {
    // Get original file from git HEAD
    const originalText = execSync('git show HEAD:src/pages/marketing/MarketingTaskModal.tsx', { encoding: 'utf-8' });
    const originalLines = originalText.split('\n');
    
    let startIdx = -1;
    let endIdx = -1;
    
    for (let i = 0; i < originalLines.length; i++) {
        if (originalLines[i].includes('{/* Tabs Section */}')) {
            startIdx = i;
        }
        if (originalLines[i].includes('{/* Footer fixed */}')) {
            endIdx = i;
        }
    }
    
    if (startIdx === -1 || endIdx === -1) {
        console.error('Indices not found in original file:', { startIdx, endIdx });
        return;
    }
    
    console.log(`Extracting from HEAD: ${startIdx} to ${endIdx}`);
    let linesToRestore = originalLines.slice(startIdx, endIdx);
    
    // Apply our mobile padding fixes to the extracted lines
    for (let i = 0; i < linesToRestore.length; i++) {
        if (linesToRestore[i].includes('<div className="mt-8 pl-14 pr-4">')) {
            linesToRestore[i] = linesToRestore[i].replace('pl-14', 'pl-4 sm:pl-14');
        }
        // and fix the footer! Oh wait, Footer is in endIdx+, we'll just fix the Tabs.
    }
    
    // Read current broken file
    const currentText = fs.readFileSync('src/pages/marketing/MarketingTaskModal.tsx', 'utf-8');
    const currentLines = currentText.split('\n');
    
    let insertIdx = -1;
    for (let i = 0; i < currentLines.length; i++) {
        if (currentLines[i].includes("const { error } = await supabase.from('marketing_tasks').update({ isarchived: true }).eq('id', editingTask.id);")) {
            // we should insert right before the button click handler definition, let's find the `                                    onClick={async () => {`
            insertIdx = i - 3; // roughly
            // Actually, let's find exactly `                        <div>`
            break;
        }
    }
    
    // Let's refine insert_idx by scanning backwards from `const { error }` to find `                        <div>`
    // Or just look for `onClick={async () => {` then `                                <button` then `                            {editingTask && (` then `                        <div>` then `<div className="px-8... Footer...`
    // Let's just find the exact line in current file where the Footer starts (wait, in my broken file there is NO footer start!! The chunk deleted the Footer start too!)
    // Let's look at the current broken lines:
    //  `                                <MarketingSectionTable `
    //  `                                    sections={form.sections} `
    //  `                                    onChange={(newSections: any[]) => setForm({ ...form, sections: newSections })} `
    //  `                                />`
    //  `                            </div>`
    //  `                                            const { error } = await supabase.from('marketing_tasks').update({ isarchived: true }).eq('id', editingTask.id);`
    for (let i = 0; i < currentLines.length; i++) {
        if (currentLines[i].includes("const { error } = await supabase.from('marketing_tasks').update({ isarchived: true })")) {
            insertIdx = i;
            break;
        }
    }
    
    // Now we must also extract the footer start lines that were lost!
    // The lost lines include `{/* Footer fixed */}` down to `try {`
    // Let's find `try {` after `Footer fixed` in original lines
    let endIdxForRestore = endIdx;
    for (let i = endIdx; i < originalLines.length; i++) {
        if (originalLines[i].includes('try {')) {
            endIdxForRestore = i + 1; // Include the try {
            break;
        }
    }
    
    linesToRestore = originalLines.slice(startIdx, endIdxForRestore);
    
    // Apply fixes
    let i_pl = linesToRestore.findIndex(l => l.includes('<div className="mt-8 pl-14 pr-4">'));
    if (i_pl !== -1) linesToRestore[i_pl] = linesToRestore[i_pl].replace('pl-14', 'pl-4 sm:pl-14');
    
    let i_footer = linesToRestore.findIndex(l => l.includes('{/* Footer fixed */}'));
    if (i_footer !== -1 && linesToRestore[i_footer+1]) {
        linesToRestore[i_footer+1] = linesToRestore[i_footer+1]
            .replace('px-8 py-5', 'px-4 sm:px-8 py-4 sm:py-5');
    }
    
    // Inject
    const newLines = [
        ...currentLines.slice(0, insertIdx),
        ...linesToRestore,
        ...currentLines.slice(insertIdx)
    ];
    
    fs.writeFileSync('src/pages/marketing/MarketingTaskModal.tsx', newLines.join('\n'));
    console.log('Patch success via node!');
}

restoreLines();
