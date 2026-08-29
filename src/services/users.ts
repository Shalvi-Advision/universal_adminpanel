import type {
  User,
  UserDetail,
  ApiResponse,
  UsersQueryParams,
  PaginatedResponse,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all users with pagination, search, filtering, and sorting
export async function getAllUsers(
  params: UsersQueryParams = {}
): Promise<PaginatedResponse<User>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.role) queryParams.append('role', params.role);
  if (params.sort) queryParams.append('sort', params.sort);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<User>>(endpoint);
}

// Get the full customer drill-down: order history, spend trend,
// addresses, favorites, and recent notifications for one user
export async function getUserDetail(userId: string): Promise<ApiResponse<UserDetail>> {
  return apiClient.get<ApiResponse<UserDetail>>(`/api/admin/users/${userId}`);
}

// Delete a user permanently. Super admin only - the API rejects everyone else.
export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/users/${userId}`);
}

// Block a user (they can no longer sign in). Super admin only.
export async function blockUser(
  userId: string,
  reason?: string
): Promise<ApiResponse<User>> {
  return apiClient.patch<ApiResponse<User>>(`/api/admin/users/${userId}/block`, { reason });
}

// Lift a block. Super admin only.
export async function unblockUser(userId: string): Promise<ApiResponse<User>> {
  return apiClient.patch<ApiResponse<User>>(`/api/admin/users/${userId}/unblock`, {});
}

// Change user role (admin/user)
export async function changeUserRole(
  userId: string,
  role: 'user' | 'admin'
): Promise<ApiResponse<User>> {
  return apiClient.patch<ApiResponse<User>>(`/api/admin/users/${userId}/role`, { role });
}
