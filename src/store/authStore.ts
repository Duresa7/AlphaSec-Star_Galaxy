import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/data/activityLog';
import { normalizeAdminPermissions } from '@/data/adminPermissions';
import type { AdminPermissionKey, AdminPermissions } from '@/types/adminPermissions';
import { DEFAULT_ADMIN_PERMISSIONS } from '@/types/adminPermissions';

interface AuthStore {
  user: User | null;
  session: Session | null;
  displayName: string | null;
  isAdmin: boolean;
  adminPermissions: AdminPermissions;
  isLoading: boolean;
  authError: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  hasAdminPermission: (permission: AdminPermissionKey) => boolean;
}

let hasInitializedAuthListener = false;
let initializeInFlight: Promise<void> | null = null;

async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, is_admin, admin_permissions')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load profile:', error);
    return {
      displayName: null as string | null,
      isAdmin: false,
      adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
    };
  }

  return {
    displayName: data?.display_name ?? null,
    isAdmin: data?.is_admin ?? false,
    adminPermissions: normalizeAdminPermissions(data?.admin_permissions),
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  displayName: null,
  isAdmin: false,
  adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
  isLoading: true,
  authError: null,

  initialize: async () => {
    if (initializeInFlight) {
      return initializeInFlight;
    }

    initializeInFlight = (async () => {
      try {
        // Check for existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const userId = session.user.id;
          set({
            user: session.user,
            session,
            displayName: null,
            isAdmin: false,
            adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
            authError: null,
          });

          void loadProfile(userId)
            .then((profile) => {
              set((state) => (state.user?.id === userId ? {
                displayName: profile.displayName,
                isAdmin: profile.isAdmin,
                adminPermissions: profile.adminPermissions,
              } : {}));
            })
            .catch((error) => {
              console.error('Failed to load profile after auth initialization:', error);
            });
        } else {
          set({
            user: null,
            session: null,
            displayName: null,
            isAdmin: false,
            adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
            authError: null,
          });
        }

        if (!hasInitializedAuthListener) {
          hasInitializedAuthListener = true;
          supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!nextSession) {
              set({
                user: null,
                session: null,
                displayName: null,
                isAdmin: false,
                adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
              });
              return;
            }

            const userId = nextSession.user.id;
            set({
              user: nextSession.user,
              session: nextSession,
              displayName: null,
              isAdmin: false,
              adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
            });

            void loadProfile(userId)
              .then((profile) => {
                set((state) => (state.user?.id === userId ? {
                  displayName: profile.displayName,
                  isAdmin: profile.isAdmin,
                  adminPermissions: profile.adminPermissions,
                } : {}));
              })
              .catch((error) => {
                console.error('Failed to load profile after auth state change:', error);
              });
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth store:', error);
        set({
          user: null,
          session: null,
          displayName: null,
          isAdmin: false,
          adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
          authError: 'Unable to initialize authentication.',
        });
      } finally {
        set({ isLoading: false });
        initializeInFlight = null;
      }
    })();

    return initializeInFlight;
  },

  signIn: async (email, password) => {
    set({ isLoading: true, authError: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ isLoading: false, authError: error.message });
      return false;
    }

    const session = data.session;
    if (!session) {
      set({ isLoading: false, authError: 'No session returned by Supabase.' });
      return false;
    }

    const profile = await loadProfile(session.user.id);
    set({
      user: session.user,
      session,
      displayName: profile.displayName,
      isAdmin: profile.isAdmin,
      adminPermissions: profile.adminPermissions,
      isLoading: false,
      authError: null,
    });

    void logActivity({
      eventType: 'auth_login',
      entityType: 'auth',
      entityId: session.user.id,
      message: `${session.user.email ?? 'User'} logged in`,
    });

    return true;
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, authError: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName?.trim() || null,
        },
      },
    });

    if (error) {
      set({ isLoading: false, authError: error.message });
      return false;
    }

    // If email confirmation is enabled, users may not get a session immediately.
    if (!data.session) {
      set({
        isLoading: false,
        authError: 'Sign up succeeded. Confirm your email, then log in.',
      });
      return false;
    }

    const profile = await loadProfile(data.session.user.id);

    if (displayName?.trim()) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', data.session.user.id);
      if (profileError) {
        console.error('Failed to persist display name:', profileError);
      }
    }

    set({
      user: data.session.user,
      session: data.session,
      displayName: displayName?.trim() || profile.displayName,
      isAdmin: profile.isAdmin,
      adminPermissions: profile.adminPermissions,
      isLoading: false,
      authError: null,
    });

    void logActivity({
      eventType: 'auth_login',
      entityType: 'auth',
      entityId: data.session.user.id,
      message: `${data.session.user.email ?? 'User'} logged in`,
      metadata: { via: 'signup' },
    });

    return true;
  },

  signOut: async () => {
    const state = get();
    const userId = state.user?.id;
    const userEmail = state.user?.email;

    if (userId) {
      await logActivity({
        eventType: 'auth_logout',
        entityType: 'auth',
        entityId: userId,
        message: `${userEmail ?? 'User'} logged out`,
      });
    }

    set({ isLoading: true, authError: null });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ isLoading: false, authError: error.message });
      return;
    }

    set({
      user: null,
      session: null,
      displayName: null,
      isAdmin: false,
      adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
      isLoading: false,
      authError: null,
    });
  },

  clearAuthError: () => set({ authError: null }),
  hasAdminPermission: (permission): boolean => {
    const state = get();
    return state.isAdmin && Boolean(state.adminPermissions[permission]);
  },
}));
