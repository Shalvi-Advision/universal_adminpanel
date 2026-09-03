import type { ReactNode } from 'react';

import { usePermissions } from 'src/contexts/permissions-context';

import { AccessDeniedView } from 'src/sections/error/access-denied-view';

// ----------------------------------------------------------------------

type SuperAdminGuardProps = {
  children: ReactNode;
};

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { isSuperAdmin } = usePermissions();

  if (!isSuperAdmin) {
    return <AccessDeniedView />;
  }

  return <>{children}</>;
}
