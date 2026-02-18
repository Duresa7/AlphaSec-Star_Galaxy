import { useMemo } from 'react';
import { useProfile } from './useProfile';
import type { UserRole } from '@/types';

export function useRole() {
  const { profile } = useProfile();

  return useMemo(() => {
    const role: UserRole = profile?.role ?? 'user';
    return {
      role,
      isAdmin: role === 'admin' || role === 'bossman',
      isBossman: role === 'bossman',
      isUser: role === 'user',
    };
  }, [profile?.role]);
}
