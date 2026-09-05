import type { ReactNode } from 'react';
import type { PermissionAction, PermissionSection, UserPermissions } from 'src/types/permissions';

import { useMemo, useContext, useCallback, createContext } from 'react';

import { getUserData } from 'src/services/auth';

// ----------------------------------------------------------------------

interface PermissionsContextType {
  permissions: UserPermissions;
  isSuperAdmin: boolean;
  // NOT implied by isSuperAdmin — the backend flag it mirrors
  // (User.imageCdnAccess) is deliberately excluded from every other
  // permission bypass, so most super admins should still see this as false.
  hasImageCdnAccess: boolean;
  hasPermission: (section: PermissionSection, action: PermissionAction) => boolean;
  canAccessSection: (section: PermissionSection) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: {},
  isSuperAdmin: false,
  hasImageCdnAccess: false,
  hasPermission: () => false,
  canAccessSection: () => false,
});

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const userData = getUserData();
  const isSuperAdmin = userData?.isSuperAdmin ?? false;
  const hasImageCdnAccess = userData?.imageCdnAccess ?? false;
  const permissions: UserPermissions = userData?.permissions ?? {};

  const hasPermission = useCallback(
    (section: PermissionSection, action: PermissionAction): boolean => {
      if (isSuperAdmin) return true;
      return permissions[section]?.[action] === true;
    },
    [isSuperAdmin, permissions]
  );

  const canAccessSection = useCallback(
    (section: PermissionSection): boolean => hasPermission(section, 'view'),
    [hasPermission]
  );

  const value = useMemo(
    () => ({ permissions, isSuperAdmin, hasImageCdnAccess, hasPermission, canAccessSection }),
    [permissions, isSuperAdmin, hasImageCdnAccess, hasPermission, canAccessSection]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}
