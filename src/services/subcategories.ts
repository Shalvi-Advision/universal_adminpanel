import type { ApiResponse, Subcategory, PaginatedResponse, SubcategoryPayload, SubcategoriesQueryParams } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get subcategories by store code (POST endpoint)
export async function getSubcategoriesByStore(
  params: SubcategoriesQueryParams
): Promise<PaginatedResponse<Subcategory>> {
  return apiClient.post<PaginatedResponse<Subcategory>>(
    '/api/admin/categories/subcategories/by-store',
    params
  );
}

export async function createSubcategory(data: SubcategoryPayload): Promise<ApiResponse<Subcategory>> {
  return apiClient.post<ApiResponse<Subcategory>>('/api/admin/categories/subcategories', data);
}

export async function updateSubcategory(id: string, data: SubcategoryPayload): Promise<ApiResponse<Subcategory>> {
  return apiClient.put<ApiResponse<Subcategory>>(`/api/admin/categories/subcategories/${id}`, data);
}

export async function deleteSubcategory(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/categories/subcategories/${id}`);
}
