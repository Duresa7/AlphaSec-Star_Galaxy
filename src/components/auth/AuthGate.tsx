import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return null; // The app's own LoadingScreen will handle the visual
  }

  return <>{children}</>;
}
