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
                let { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                if (profileError && profileError.code === 'PGRST116') {
                    // Try to auto-create profile if missing
                    const { data: newProfile, error: insertError } = await supabase
                        .from('profiles')
                        .insert([{ 
                            id: session.user.id, 
                            full_name: session.user.email?.split('@')[0] || 'User',
                            role: 'Nhân viên'
                        }])
                        .select()
                        .single()
                    
                    if (!insertError) profileData = newProfile
                }

                set({ user: session.user, profile: profileData, loading: false })
                await get().fetchPermissions()
            } else {
                set({ user: null, profile: null, loading: false, systemPermissions: null })
            }
        } catch (error) {
            console.error('Session error:', error)
            set({ user: null, profile: null, loading: false, systemPermissions: null })
        }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, systemPermissions: null })
    },

    hasPermission: (role?: string, actionKey?: string) => {
        if (!role || !actionKey) return false;
        if (role === 'Admin' || role === 'Giám đốc') return true;
        const { systemPermissions } = get();
        const fallbackPermissions = generateFlatPermissions();
        const permsToUse = systemPermissions || fallbackPermissions;
        return !!permsToUse[actionKey]?.[role];
    }
}))
