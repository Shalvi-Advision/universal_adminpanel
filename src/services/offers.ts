import type { Offer, ApiResponse, OfferPayload, OffersQueryParams, PaginatedResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

export async function getAllOffers(
  params: OffersQueryParams = {}
): Promise<PaginatedResponse<Offer>> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.store_code) queryParams.append('store_code', params.store_code);
  if (params.is_active) queryParams.append('is_active', params.is_active);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/offers${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<Offer>>(endpoint);
}

export async function createOffer(data: OfferPayload): Promise<ApiResponse<Offer>> {
  return apiClient.post<ApiResponse<Offer>>('/api/admin/offers', data);
}

export async function updateOffer(id: string, data: OfferPayload): Promise<ApiResponse<Offer>> {
  return apiClient.put<ApiResponse<Offer>>(`/api/admin/offers/${id}`, data);
}

export async function deleteOffer(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/offers/${id}`);
}

export async function toggleOffer(id: string): Promise<ApiResponse<Offer>> {
  return apiClient.patch<ApiResponse<Offer>>(`/api/admin/offers/${id}/toggle`);
}
