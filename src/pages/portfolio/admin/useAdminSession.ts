import { useEffect, useState } from 'react';
import { landingSupabase } from '../sections/landingSupabase';

export interface AdminProfile {
  id: string;
  email: string;
  role: 'pending' | 'editor' | 'admin';
  is_active: boolean;
}

export function useAdminSession() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadProfile = async (uid: string) => {
    const { data } = await landingSupabase.from('landing_admin_profiles').select('id,email,role,is_active').eq('id', uid).maybeSingle();
    setProfile(data as AdminProfile | null);
  };

  useEffect(() => {
    landingSupabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id || null;
      setUserId(uid);
      if (uid) loadProfile(uid).finally(() => setLoading(false));
      else setLoading(false);
    });
    const { data: sub } = landingSupabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) loadProfile(uid);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = () => { if (userId) loadProfile(userId); };
  const signOut = () => landingSupabase.auth.signOut();

  return {
    loading,
    userId,
    profile,
    isActiveEditor: !!profile && profile.is_active && (profile.role === 'editor' || profile.role === 'admin'),
    isAdmin: !!profile && profile.is_active && profile.role === 'admin',
    refreshProfile,
    signOut,
  };
}
