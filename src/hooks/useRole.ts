import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

export function useRole() {
  const { profile } = useAuth();

  return useMemo(() => {
    const role: UserRole = profile?.role ?? 'user';
    return {
      role,
      isAdmin: role === 'admin' || role === 'bossman',
      isBossman: role === 'bossman',
      isUser: role === 'user',
      canAccessGalaxy: role === 'galaxy_user' || role === 'admin' || role === 'bossman',
    };
  }, [profile?.role]);
}
