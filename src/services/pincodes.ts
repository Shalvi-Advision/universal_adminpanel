import type {
  Pincode,
  ApiResponse,
  PincodePayload,
  PaginatedResponse,
  PincodesQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all pincodes with pagination, search, and sorting
export async function getAllPincodes(
  params: PincodesQueryParams = {}
): Promise<PaginatedResponse<Pincode>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.storeCode) queryParams.append('storeCode', params.storeCode);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/pincodes${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<Pincode>>(endpoint);
}

// Get single pincode by ID
export async function getPincodeById(id: string): Promise<ApiResponse<Pincode>> {
  return apiClient.get<ApiResponse<Pincode>>(`/api/admin/content/pincodes/${id}`);
}

// Create new pincode
export async function createPincode(data: PincodePayload): Promise<ApiResponse<Pincode>> {
  return apiClient.post<ApiResponse<Pincode>>('/api/admin/content/pincodes', data);
}

// Update existing pincode
export async function updatePincode(
  id: string,
  data: PincodePayload
): Promise<ApiResponse<Pincode>> {
  return apiClient.put<ApiResponse<Pincode>>(`/api/admin/content/pincodes/${id}`, data);
}

// Delete pincode
export async function deletePincode(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/pincodes/${id}`);
}
