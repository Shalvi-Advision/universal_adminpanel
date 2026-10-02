import type {
  Product,
  ApiResponse,
  ProductsQueryParams,
  ProductMasterPayload,
  ProductsByStoreResponse,
  BulkProductCsvUpdateResult,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';
import { getSelectedProjectCode } from 'src/utils/project-code';

// Get products by store code (POST endpoint)
export async function getProductsByStore(
  params: ProductsQueryParams
): Promise<ProductsByStoreResponse> {
  return apiClient.post<ProductsByStoreResponse>('/api/admin/products/by-store', params);
}

export async function createProduct(data: ProductMasterPayload): Promise<ApiResponse<Product>> {
  return apiClient.post<ApiResponse<Product>>('/api/admin/products/master', data);
}

export async function updateProduct(id: string, data: Partial<ProductMasterPayload>): Promise<ApiResponse<Product>> {
  return apiClient.put<ApiResponse<Product>>(`/api/admin/products/master/${id}`, data);
}

// storeCode scopes the delete to removing this one store's listing — the
// backend removes the whole product (every store) only when it's omitted,
// which this call never does from the by-store list's own delete button
// (that's always "remove from the store I'm looking at", never "remove
// this product everywhere").
export async function deleteProduct(id: string, storeCode: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/products/master/${id}`, { store_code: storeCode });
}

// Multipart, so it bypasses apiClient (which always JSON-stringifies) and
// hand-rolls the fetch, same pattern as src/services/image-cdn.ts's
// uploadImageCdnImage. Store admins re-export their own rate/stock sheet
// (P_CODE, BARCODE, package_size, BRAND_NAME, BR_CODE, our_price,
// product_mrp, quantity, store_code_status) periodically and upload it
// here to refresh price/stock/active-status for every p_code it mentions
// — an update-only pass, never inserts a new product.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface BulkUpdateProductsCsvOptions {
  storeCode?: string;
  // Opt-in daily reconcile: also creates newly-stocked (p_code, store)
  // combos and deactivates ones missing from today's file — see the
  // backend route's own comment for the full semantics.
  syncMode?: boolean;
  // Forces through a store's deactivations after the safety guard held
  // them back on a first sync_mode pass (see deactivation_blocked).
  confirmDeactivation?: boolean;
  // Computes and returns every count without writing anything.
  dryRun?: boolean;
}

export async function bulkUpdateProductsCsv(
  file: File,
  options: BulkUpdateProductsCsvOptions = {}
): Promise<{ success: boolean; message: string; data: BulkProductCsvUpdateResult }> {
  const { storeCode, syncMode, confirmDeactivation, dryRun } = options;
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  formData.append('file', file);
  if (storeCode) formData.append('store_code', storeCode);
  if (syncMode) formData.append('sync_mode', 'true');
  if (confirmDeactivation) formData.append('confirm_deactivation', 'true');
  if (dryRun) formData.append('dry_run', 'true');

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
