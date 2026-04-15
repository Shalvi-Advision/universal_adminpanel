import type { ReactNode } from 'react';
import type { PermissionSection } from 'src/types/permissions';

import { usePermissions } from 'src/contexts/permissions-context';

import { AccessDeniedView } from 'src/sections/error/access-denied-view';

// ----------------------------------------------------------------------

type PermissionGuardProps = {
  section: PermissionSection;
  children: ReactNode;
};

export function PermissionGuard({ section, children }: PermissionGuardProps) {
  const { canAccessSection } = usePermissions();

  if (!canAccessSection(section)) {
    return <AccessDeniedView />;
  }

  return <>{children}</>;
}
