export const DEFAULT_PHASES = [
    { key: 'concept', name: 'Concept', kpiPct: 15 },       // 15% of total KPI days
    { key: '3d', name: '3D / Phối cảnh', kpiPct: 35 },     // 35%
    { key: '2d', name: '2D / Triển khai', kpiPct: 27 },     // 27%
    { key: 'construction', name: 'Construction / Hồ sơ TC', kpiPct: 23 }, // 23%
    { key: '_unassigned', name: 'Khác / Bổ sung', kpiPct: 0 } // Fallback for unmatched tasks
];

// Auto-detect which phase a task belongs to from its target/name
export function detectPhase(task: any): string {
    // Direct target match (set from the task form dropdown)
    const tgt = (task.target || '').toLowerCase();
    if (['concept', '3d', '2d', 'construction'].includes(tgt)) return tgt;
    
    // Fallback: detect from name
    const str = (task.name || '').toLowerCase();
    if (str.includes('concept') || str.includes('moodboard') || str.includes('ý tưởng') || str.includes('phương án')) return 'concept';
    if (str.includes('3d') || str.includes('render') || str.includes('phối cảnh') || str.includes('nội thất 3d')) return '3d';
    if (str.includes('2d') || str.includes('triển khai') || str.includes('mep') || str.includes('bản vẽ') || str.includes('kỹ thuật') || str.includes('hồ sơ') || str.includes('tender')) return '2d';
    if (str.includes('giám sát') || str.includes('thi công') || str.includes('construction') || str.includes('nghiệm thu')) return 'construction';
    
    return '_unassigned';
}

/**
 * Calculates end date skipping Sundays.
 * daysNeeded = 1 means it ends on the same day.
 */
export function addWorkingDays(startDate: Date, daysNeeded: number): Date {
    let current = new Date(startDate);
    
    // If start date is Sunday, automatically push it to Monday
    if (current.getDay() === 0) {
        current.setDate(current.getDate() + 1);
    }
    
    if (daysNeeded <= 1) return current;

    let daysToAdd = daysNeeded - 1;

    while (daysToAdd > 0) {
        current.setDate(current.getDate() + 1);
        if (current.getDay() !== 0) { // 0 is Sunday
            daysToAdd--;
        }
    }
    return current;
}

export function getNextWorkingDay(date: Date): Date {
    let current = new Date(date);
    do {
        current.setDate(current.getDate() + 1);
    } while (current.getDay() === 0);
    return current;
}
