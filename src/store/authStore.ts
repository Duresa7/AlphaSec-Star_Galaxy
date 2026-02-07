import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  initialize: async () => {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      set({ user: session.user, session, isLoading: false });
    } else {
      // Auto sign-in anonymously for collaborative shared experience
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Anonymous auth failed:', error);
        set({ isLoading: false });
        return;
      }
      set({ user: data.session?.user ?? null, session: data.session, isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session });
    });
  },
}));
