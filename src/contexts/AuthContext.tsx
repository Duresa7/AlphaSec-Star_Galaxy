import { createContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { deleteAccount as deleteAccountRequest } from '@/data/supabaseStorage';
import { withTimeout } from '@/utils/withTimeout';

export interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  supabaseConfigured: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateEmail: (newEmail: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_OPERATION_TIMEOUT_MS = 15_000;
const INITIAL_AUTH_TIMEOUT_MS = 7_000;
const SESSION_BOOTSTRAP_TIMEOUT_MS = 4_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const initialAuthResolvedRef = useRef(!supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;

    initialAuthResolvedRef.current = false;

    const resolveAuthState = (newSession: Session | null) => {
      setSession(newSession);

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
  }, []);

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
      }
      setLoading(false);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to sign in. Please try again.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
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

  const updateEmail = useCallback(async (newEmail: string) => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ email: newEmail }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Email update timed out. Please try again.',
      );
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to update email. Please try again.' };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        AUTH_OPERATION_TIMEOUT_MS,
        'Password update timed out. Please try again.',
      );
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to update password. Please try again.' };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabaseConfigured) return { error: 'Supabase is not configured' };
    if (!session?.access_token) return { error: 'Not authenticated' };
    const result = await deleteAccountRequest();
    if (!result.error) {
      setSession(null);
      setLoading(false);
      try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* best-effort */ }
    }
    return result;
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, loading, supabaseConfigured, signUp, signIn, signOut, updateEmail, updatePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}
