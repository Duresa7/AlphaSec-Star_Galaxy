import { createContext, useLayoutEffect, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types';

export interface ProfileContextValue {
  profile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequestsInFlightRef = useRef(0);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabaseConfigured) return;
    profileRequestsInFlightRef.current += 1;
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch profile:', error);
        setProfile(null);
        return;
      }

      setProfile((data as UserProfile | null) ?? null);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
    } finally {
      profileRequestsInFlightRef.current = Math.max(0, profileRequestsInFlightRef.current - 1);
      if (profileRequestsInFlightRef.current === 0) {
        setProfileLoading(false);
      }
    }
  }, []);

  // useLayoutEffect to set profileLoading synchronously before paint,
  // avoiding a flash where session exists but profileLoading is false.
  useLayoutEffect(() => {
    if (session?.user?.id) {
      setProfileLoading(true);
      void fetchProfile(session.user.id);
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [session?.user?.id, fetchProfile]);

  // Periodic refresh
  useEffect(() => {
    if (!supabaseConfigured || !session?.user?.id) return;
    const interval = setInterval(() => {
      fetchProfile(session.user.id);
    }, 60_000);
    return () => clearInterval(interval);
  }, [session, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, profileLoading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}
