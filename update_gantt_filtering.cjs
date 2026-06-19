const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

// 1. Add isOverlapping function
if (!content.includes('const isOverlapping =')) {
    const helperCode = `\nconst isOverlapping = (start: Date | null, end: Date | null, currentYear: number, currentMonth: number) => {
    if (!start || !end) return false;
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    return start <= monthEnd && end >= monthStart;
};\n\n`;
    content = content.replace('export const Gantt = () => {', helperCode + 'export const Gantt = () => {');
}

// 2. Replace project filtering
const oldProjectCheck = `            if (start.getFullYear() === year && start.getMonth() === month ||
                end.getFullYear() === year && end.getMonth() === month ||
                (start < new Date(year, month, 1) && end > new Date(year, month + 1, 0))) {`;
const newProjectCheck = `            const projectOverlaps = isOverlapping(start, end, year, month);
            if (!projectOverlaps) return;

            if (projectOverlaps) {`;
content = content.replace(oldProjectCheck, newProjectCheck);

// 3. Replace phase filtering
const oldPhaseCheck = `                    // Calculate expected end date for this phase
                    const phaseEndDate = hasExpectedTimeline ? addWorkingDays(currentPhaseStartDate, expectedDays) : currentPhaseStartDate;`;
const newPhaseCheck = `                    // Calculate expected end date for this phase
                    const phaseEndDate = hasExpectedTimeline ? addWorkingDays(currentPhaseStartDate, expectedDays) : currentPhaseStartDate;

                    let phaseOverlaps = false;
                    if (hasExpectedTimeline) {
                        phaseOverlaps = isOverlapping(currentPhaseStartDate, phaseEndDate, year, month);
                    }

                    const overlappingTasks = phaseTasks.filter(t => {
                        const tStart = t.start_date ? new Date(t.start_date) : null;
                        const tEnd = t.due_date ? new Date(t.due_date) : null;
                        return isOverlapping(tStart || tEnd, tEnd || tStart, year, month);
                    });

                    if (!phaseOverlaps && overlappingTasks.length === 0) {
                        if (hasExpectedTimeline) {
                            currentPhaseStartDate = getNextWorkingDay(phaseEndDate);
                        }
                        return; // Skip phase
                    }`;
content = content.replace(oldPhaseCheck, newPhaseCheck);

// 4. Update task loop to only use overlappingTasks
const oldTaskLoop = `                    // Get actual subtasks if this phase is expanded
                    if (expandedPhases.has(fakePhaseId)) {
                        phaseTasks.sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }));
                        
                        phaseTasks.forEach(t => {`;
const newTaskLoop = `                    // Get actual subtasks if this phase is expanded
                    if (expandedPhases.has(fakePhaseId)) {
                        overlappingTasks.sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }));
                        
                        overlappingTasks.forEach(t => {`;
content = content.replace(oldTaskLoop, newTaskLoop);

fs.writeFileSync(ganttPath, content);
console.log('Update script completed.');
