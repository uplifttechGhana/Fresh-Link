import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '../lib/authStore';

const ROLE_HOME: Record<UserRole, string> = {
  buyer: '/buyer/home',
  farmer: '/farmer/dashboard',
  transport: '/transport/dashboard',
  investor: '/investor/dashboard',
  admin: '/admin/dashboard',
};

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <>{children}</>;
}

/** Guest buyers can browse; logged-in non-buyers are sent to their dashboard. */
export function BuyerBrowseRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();

  if (user && accessToken && user.role !== 'buyer') {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <>{children}</>;
}
