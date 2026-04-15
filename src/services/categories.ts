import type { Category, ApiResponse, CategoryPayload, PaginatedResponse, CategoriesQueryParams } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get categories by store code (POST endpoint)
export async function getCategoriesByStore(
  params: CategoriesQueryParams
): Promise<PaginatedResponse<Category>> {
  return apiClient.post<PaginatedResponse<Category>>('/api/admin/categories/by-store', params);
}

export async function createCategory(data: CategoryPayload): Promise<ApiResponse<Category>> {
  return apiClient.post<ApiResponse<Category>>('/api/admin/categories', data);
}

export async function updateCategory(id: string, data: CategoryPayload): Promise<ApiResponse<Category>> {
  return apiClient.put<ApiResponse<Category>>(`/api/admin/categories/${id}`, data);
}

export async function deleteCategory(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/categories/${id}`);
}
