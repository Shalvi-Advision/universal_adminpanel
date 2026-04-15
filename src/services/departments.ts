import type { Department, ApiResponse, DepartmentPayload, PaginatedResponse, DepartmentsQueryParams } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all departments with query parameters (GET endpoint)
export async function getAllDepartments(
  params: DepartmentsQueryParams = {}
): Promise<PaginatedResponse<Department>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.storeCode) queryParams.append('storeCode', params.storeCode);
  if (params.deptTypeId) queryParams.append('deptTypeId', params.deptTypeId);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/categories/departments/all${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<Department>>(endpoint);
}

export async function createDepartment(data: DepartmentPayload): Promise<ApiResponse<Department>> {
  return apiClient.post<ApiResponse<Department>>('/api/admin/categories/departments', data);
}

export async function updateDepartment(id: string, data: DepartmentPayload): Promise<ApiResponse<Department>> {
  return apiClient.put<ApiResponse<Department>>(`/api/admin/categories/departments/${id}`, data);
}

export async function deleteDepartment(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/categories/departments/${id}`);
}
