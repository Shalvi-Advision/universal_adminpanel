import type { User, ApiResponse } from 'src/types/api';
import type { UserPermissions } from 'src/types/permissions';

import { apiClient } from 'src/utils/api-client';

export async function getAdminUsers(): Promise<ApiResponse<User[]>> {
  return apiClient.get<ApiResponse<User[]>>('/api/admin/permissions/admins');
}

export async function getAdminPermissions(userId: string): Promise<ApiResponse<User>> {
  return apiClient.get<ApiResponse<User>>(`/api/admin/permissions/admins/${userId}`);
}

export async function updateAdminPermissions(
  userId: string,
  permissions: UserPermissions
): Promise<ApiResponse<User>> {
  return apiClient.put<ApiResponse<User>>(`/api/admin/permissions/admins/${userId}`, {
    permissions,
  });
}
