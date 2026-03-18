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
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

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
