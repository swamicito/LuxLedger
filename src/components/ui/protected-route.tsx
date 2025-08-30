import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground">
            You need {requiredRole} access to view this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Current role: {userRole || 'pending_user'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}