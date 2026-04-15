import type { ReactElement } from 'react';
import type { PermissionAction, PermissionSection } from 'src/types/permissions';

import { cloneElement } from 'react';

import { usePermissions } from 'src/contexts/permissions-context';

// ----------------------------------------------------------------------

type PermissionButtonProps = {
  section: PermissionSection;
  action: PermissionAction;
  children: ReactElement;
  fallback?: 'hide' | 'disable';
};

export function PermissionButton({
  section,
  action,
  children,
  fallback = 'hide',
}: PermissionButtonProps) {
  const { hasPermission } = usePermissions();

  if (hasPermission(section, action)) {
    return children;
  }

  if (fallback === 'disable') {
    return cloneElement(children, { disabled: true } as any);
  }

  return null;
}
