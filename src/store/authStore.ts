import { create } from 'zustand'
import { supabase } from '../services/supabase'
import type { Profile } from '../types'
import { generateFlatPermissions } from '../constants/permissions'

interface AuthState {
    user: any | null
    profile: Profile | null
    loading: boolean
    systemPermissions: Record<string, any> | null
    checkSession: () => Promise<void>
    fetchPermissions: () => Promise<void>
    signOut: () => Promise<void>
    hasPermission: (role?: string, actionKey?: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    systemPermissions: null,

    fetchPermissions: async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('id', 'permissions')
                .single()
            if (!error && data?.value) {
                set({ systemPermissions: data.value as Record<string, any> })
            }
        } catch (err) {
            console.error('Error fetching permissions:', err)
        }
    },

    checkSession: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                // Fetch custom profile data (staff_id, full_name, role) from profiles table
                let { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                // If profile doesn't exist (e.g. first time Google Login), auto-create one securely via Admin API
                if (profileError && profileError.code === 'PGRST116') {
                    const newStaffId = `NV${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
                    try {
                        const res = await fetch('/api/admin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'auto_provision_profile',
                                payload: {
                                    id: session.user.id,
                                    email: session.user.email,
                                    full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
                                    role: 'Nhân viên',
                                    staff_id: newStaffId,
                                    position: 'Nhân viên mới'
                                }
                            })
                        });
                        
                        if (!res.ok) {
                            let errMsg = res.statusText;
                            try {
                                const errData = await res.json();
                                errMsg = errData.error || res.statusText;
                            } catch (e) {}
                            throw new Error(errMsg);
                        }
                        
                        const responseData = await res.json();
                        if (responseData.success && responseData.profile) {
                            profileData = responseData.profile;
                            profileError = null;
                        } else {
                            throw new Error('Failed to create default profile API');
                        }
                    } catch (apiError) {
                        console.error("Auto-provision profile API failed:", apiError)
                        throw apiError;
                    }
                } else if (profileError) {
                    throw profileError
                }

                set({ user: session.user, profile: profileData, loading: false })
                // Fetch dynamic permissions after profile is loaded
                await get().fetchPermissions()
            } else {
                set({ user: null, profile: null, loading: false, systemPermissions: null })
            }
        } catch (error) {
            console.error('Error fetching session:', error)
            set({ user: null, profile: null, loading: false, systemPermissions: null })
        }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, systemPermissions: null })
    },

    hasPermission: (role?: string, actionKey?: string) => {
        if (!role || !actionKey) return false;
        
        // Admins can do everything
        if (role === 'Admin' || role === 'Giám đốc') return true;

        const { systemPermissions } = get();
        const fallbackPermissions = generateFlatPermissions();
        const permsToUse = systemPermissions && Object.keys(systemPermissions).length > 0 ? systemPermissions : fallbackPermissions;

        return !!permsToUse[actionKey]?.[role];
    }
}))
