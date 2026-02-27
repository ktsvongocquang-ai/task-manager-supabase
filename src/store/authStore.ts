import { create } from 'zustand'
import { supabase } from '../services/supabase'
import type { Profile } from '../types'

interface AuthState {
    user: any | null
    profile: Profile | null
    loading: boolean
    checkSession: () => Promise<void>
    signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    loading: true,
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
            } else {
                set({ user: null, profile: null, loading: false })
            }
        } catch (error) {
            console.error('Error fetching session:', error)
            set({ user: null, profile: null, loading: false })
        }
    },
    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
    }
}))
