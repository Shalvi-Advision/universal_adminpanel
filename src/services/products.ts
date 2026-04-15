import type { Product, ApiResponse, PaginatedResponse, ProductsQueryParams, ProductMasterPayload } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get products by store code (POST endpoint)
export async function getProductsByStore(
  params: ProductsQueryParams
): Promise<PaginatedResponse<Product>> {
  return apiClient.post<PaginatedResponse<Product>>('/api/admin/products/by-store', params);
}

export async function createProduct(data: ProductMasterPayload): Promise<ApiResponse<Product>> {
  return apiClient.post<ApiResponse<Product>>('/api/admin/products/master', data);
}

export async function updateProduct(id: string, data: Partial<ProductMasterPayload>): Promise<ApiResponse<Product>> {
  return apiClient.put<ApiResponse<Product>>(`/api/admin/products/master/${id}`, data);
}

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/products/master/${id}`);
}
