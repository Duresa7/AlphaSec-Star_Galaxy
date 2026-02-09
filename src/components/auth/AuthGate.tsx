import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return <>{children}</>;
}
