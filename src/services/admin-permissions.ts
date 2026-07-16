import type { User, ApiResponse } from 'src/types/api';
import type { UserPermissions } from 'src/types/permissions';

import { apiClient } from 'src/utils/api-client';

export interface CreateAdminPayload {
  mobile: string;
  name: string;
  email?: string;
  permissions?: UserPermissions;
  allowed_project_codes: string[];
}

export interface UpdateAdminPayload {
  permissions?: UserPermissions;
  allowed_project_codes?: string[];
}

export async function getAdminUsers(): Promise<ApiResponse<User[]>> {
  return apiClient.get<ApiResponse<User[]>>('/api/admin/permissions/admins');
}

export async function getAdminPermissions(userId: string): Promise<ApiResponse<User>> {
  return apiClient.get<ApiResponse<User>>(`/api/admin/permissions/admins/${userId}`);
}

export async function createAdmin(payload: CreateAdminPayload): Promise<ApiResponse<User>> {
  return apiClient.post<ApiResponse<User>>('/api/admin/permissions/admins', payload);
}

export async function updateAdmin(
  userId: string,
  payload: UpdateAdminPayload
): Promise<ApiResponse<User>> {
  return apiClient.put<ApiResponse<User>>(`/api/admin/permissions/admins/${userId}`, payload);
}

export async function updateAdminPermissions(
  userId: string,
  permissions: UserPermissions
): Promise<ApiResponse<User>> {
  return updateAdmin(userId, { permissions });
}
