import { useContext } from 'react';
import { ProfileContext } from '@/contexts/ProfileContext';
import type { ProfileContextValue } from '@/contexts/ProfileContext';

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
