import { createContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { UserProfile } from '@/types';

export interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  supabaseConfigured: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_OPERATION_TIMEOUT_MS = 15_000;
const INITIAL_AUTH_TIMEOUT_MS = 7_000;
const SESSION_BOOTSTRAP_TIMEOUT_MS = 4_000;

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const initialAuthResolvedRef = useRef(!supabaseConfigured);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabaseConfigured) return;
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
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    if (!supabaseConfigured) return;

    initialAuthResolvedRef.current = false;

    const resolveAuthState = (newSession: Session | null) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        void fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }

      if (!initialAuthResolvedRef.current) {
        initialAuthResolvedRef.current = true;
        setLoading(false);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        resolveAuthState(newSession);
      }
    );
    void withTimeout(
      supabase.auth.getSession(),
      SESSION_BOOTSTRAP_TIMEOUT_MS,
      'Session bootstrap timed out.',
    )
      .then(({ data }) => {
        if (data.session) {
          resolveAuthState(data.session);
        }
      })
      .catch(() => {});
    const timeout = window.setTimeout(() => {
      if (!initialAuthResolvedRef.current) {
        initialAuthResolvedRef.current = true;
        setLoading(false);
      }
    }, INITIAL_AUTH_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [fetchProfile]);
  useEffect(() => {
    if (!supabaseConfigured || !session?.user?.id) return;
    const interval = setInterval(() => {
      fetchProfile(session.user.id);
    }, 60_000);
    return () => clearInterval(interval);
  }, [session, fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Sign-up timed out. Please try again.',
      );
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to sign up. Please try again.' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Sign-in timed out. Please try again.',
      );
      if (error) return { error: error.message };

      if (data.session) {
        setSession(data.session);
        if (data.session.user?.id) {
          void fetchProfile(data.session.user.id);
        }
      }
      setLoading(false);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to sign in. Please try again.' };
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setLoading(false);
    if (!supabaseConfigured) return;

    try {
      const { error } = await withTimeout(
        supabase.auth.signOut({ scope: 'local' }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Sign-out timed out. Local session has been cleared.',
      );
      if (error) {
        console.error('Failed to sign out from Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to sign out from Supabase:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, supabaseConfigured, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
