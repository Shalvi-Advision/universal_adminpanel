import type { UserPermissions } from 'src/types/permissions';
import type { User, ApiResponse, ProjectStore } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

export interface CreateAdminPayload {
  mobile: string;
  name: string;
  email?: string;
  password?: string;
  permissions?: UserPermissions;
  allowed_project_codes: string[];
  allowed_store_codes?: string[];
}

export interface UpdateAdminPayload {
  permissions?: UserPermissions;
  allowed_project_codes?: string[];
  allowed_store_codes?: string[];
  password?: string;
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

// Stores for a specific project, regardless of which project is currently
// selected in the panel — backs the store checklist below the project
// checklist on this page.
export async function getProjectStores(
  projectCode: string
): Promise<ApiResponse<ProjectStore[]>> {
  return apiClient.get<ApiResponse<ProjectStore[]>>(
    `/api/admin/permissions/projects/${projectCode}/stores`
  );
}
