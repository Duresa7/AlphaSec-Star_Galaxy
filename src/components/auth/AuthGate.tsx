import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthScreen } from '@/components/auth/AuthScreen';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isLoading, user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
