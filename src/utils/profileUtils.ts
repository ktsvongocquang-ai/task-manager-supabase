export const getAssignableProfiles = (profiles: any[], target: string | null | undefined, currentAssigneeIds: string[] = [], currentUserRole?: string) => {
    const targetLower = target ? target.toLowerCase() : '';
    const isDesignPhase = targetLower === 'concept' || targetLower === '3d' || targetLower === '2d';
    const isConstructionPhase = targetLower === 'construction';

    // If current user is Admin or Manager, show ALL internal staff (except Khách Hàng)
    const userRoleLower = currentUserRole?.toLowerCase() || '';
    const isCurrentUserManager = userRoleLower.includes('admin') || userRoleLower.includes('quản lý') || userRoleLower.includes('giám đốc');

    return profiles.filter(p => {
        // Always include if already assigned
        if (currentAssigneeIds.includes(p.id)) return true;

        const role = p.role?.toLowerCase() || '';

        // Always exclude Khách Hàng
        if (role.includes('khách')) return false;

        // Admin/Manager can see all internal staff regardless of phase
        if (isCurrentUserManager) return true;
        
        const isManager = role.includes('admin') || role.includes('quản lý') || role.includes('giám đốc');
        
        if (isDesignPhase) {
            return role.includes('thiết kế') || role.includes('triển khai') || isManager;
        }
        if (isConstructionPhase) {
            return role.includes('thi công') || role.includes('giám sát') || role.includes('kỹ sư') || isManager;
        }

        // If no specific phase, exclude marketing
        if (role.includes('marketing')) {
            return false;
        }

        // Include all other internal staff
        return true;
    });
};

