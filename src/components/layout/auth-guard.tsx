import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { DEV_MODE } from '@/lib/constants';
import type { ReactNode } from 'react';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (DEV_MODE) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
