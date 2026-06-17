export const getAssignableProfiles = (profiles: any[], target: string | null | undefined, currentAssigneeIds: string[] = []) => {
    const targetLower = target ? target.toLowerCase() : '';
    const isDesignPhase = targetLower === 'concept' || targetLower === '3d' || targetLower === '2d';
    const isConstructionPhase = targetLower === 'construction';

    return profiles.filter(p => {
        // Always include if already assigned
        if (currentAssigneeIds.includes(p.id)) return true;

        const role = p.role?.toLowerCase() || '';
        const isManager = role.includes('admin') || role.includes('quản lý') || role.includes('giám đốc');
        
        if (isDesignPhase) {
            return role.includes('thiết kế') || role.includes('triển khai') || isManager;
        }
        if (isConstructionPhase) {
            return role.includes('thi công') || role.includes('giám sát') || isManager;
        }

        // If no specific phase is selected, or if the phase is something else,
        // we still want to EXCLUDE Khách Hàng and Marketing from being assignable by default.
        if (role.includes('khách') || role.includes('marketing')) {
            return false;
        }

        // Include all other internal staff
        return true;
    });
};
