import type { ReactNode } from 'react';

import { usePermissions } from 'src/contexts/permissions-context';

import { AccessDeniedView } from 'src/sections/error/access-denied-view';

// ----------------------------------------------------------------------

type ImageCdnGuardProps = {
  children: ReactNode;
};

// Mirrors SuperAdminGuard's shape but checks a different flag on purpose:
// imageCdnAccess is granted per-admin, independent of isSuperAdmin (see
// src/contexts/permissions-context.tsx and the backend's
// requireImageCdnAccess middleware, which the same distinction exists in).
export function ImageCdnGuard({ children }: ImageCdnGuardProps) {
  const { hasImageCdnAccess } = usePermissions();

  if (!hasImageCdnAccess) {
    return <AccessDeniedView />;
  }

  return <>{children}</>;
}
