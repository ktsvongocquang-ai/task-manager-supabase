export const getAssignableProfiles = (profiles: any[], target: string | null | undefined, currentAssigneeIds: string[] = []) => {
    if (!target) return profiles;
    
    const targetLower = target.toLowerCase();
    const isDesignPhase = targetLower === 'concept' || targetLower === '3d' || targetLower === '2d';
    const isConstructionPhase = targetLower === 'construction';

    if (!isDesignPhase && !isConstructionPhase) return profiles;

    return profiles.filter(p => {
        if (currentAssigneeIds.includes(p.id)) return true;

        const role = p.role?.toLowerCase() || '';
        const isManager = role.includes('admin') || role.includes('quản lý') || role.includes('giám đốc');
        
        if (isDesignPhase) {
            return role.includes('thiết kế') || role.includes('triển khai') || isManager;
        }
        if (isConstructionPhase) {
            return role.includes('thi công') || role.includes('giám sát') || isManager;
        }
        return true;
    });
};
