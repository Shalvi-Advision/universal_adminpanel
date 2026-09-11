import type {
  Product,
  ApiResponse,
  PaginatedResponse,
  ProductsQueryParams,
  ProductMasterPayload,
  BulkProductCsvUpdateResult,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';
import { getSelectedProjectCode } from 'src/utils/project-code';

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

// Multipart, so it bypasses apiClient (which always JSON-stringifies) and
// hand-rolls the fetch, same pattern as src/services/image-cdn.ts's
// uploadImageCdnImage. Store admins re-export their own rate/stock sheet
// (P_CODE, BARCODE, package_size, BRAND_NAME, BR_CODE, our_price,
// product_mrp, quantity, store_code_status) periodically and upload it
// here to refresh price/stock/active-status for every p_code it mentions
// — an update-only pass, never inserts a new product.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function bulkUpdateProductsCsv(
  file: File,
  storeCode?: string
): Promise<{ success: boolean; message: string; data: BulkProductCsvUpdateResult }> {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  formData.append('file', file);
  if (storeCode) formData.append('store_code', storeCode);

  const response = await fetch(`${API_BASE_URL}/api/admin/products/bulk-update-csv`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Project-Code': getSelectedProjectCode(),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update products from CSV');
  }

  return data;
}
