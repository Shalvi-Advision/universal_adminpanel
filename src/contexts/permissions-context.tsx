import type { ReactNode } from 'react';
import type { PermissionAction, PermissionSection, UserPermissions } from 'src/types/permissions';

import { useMemo, useContext, useCallback, createContext } from 'react';

import { getUserData } from 'src/services/auth';

// ----------------------------------------------------------------------

interface PermissionsContextType {
  permissions: UserPermissions;
  isSuperAdmin: boolean;
  hasPermission: (section: PermissionSection, action: PermissionAction) => boolean;
  canAccessSection: (section: PermissionSection) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: {},
  isSuperAdmin: false,
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
    () => ({ permissions, isSuperAdmin, hasPermission, canAccessSection }),
    [permissions, isSuperAdmin, hasPermission, canAccessSection]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}
