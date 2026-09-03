import type { ApiResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// ----------------------------------------------------------------------

export type SubscriptionStatus = 'active' | 'upcoming' | 'expired' | 'cancelled';

// A single subscription period for a tenant. A "renew" creates a new record
// rather than mutating this one — history is kept intact.
export interface SubscriptionRecord {
  _id: string;
  project_code: string;
  start_date: string;
  end_date: string;
  product_limit: number;
  status: SubscriptionStatus;
  notes: string;
  created_by_name: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/subscriptions/status response payload for the current tenant.
export interface MySubscriptionStatus {
  hasSubscription: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  daysRemaining: number;
  productLimit: number | null;
  currentProductCount: number;
  subscription: SubscriptionRecord | null;
}

// One row of the superadmin "all tenants" list.
export interface TenantSubscriptionSummary {
  project_code: string;
  client_name: string;
  current: SubscriptionRecord | null;
}

export interface CreateOrRenewSubscriptionPayload {
  start_date: string;
  end_date: string;
  product_limit: number;
  notes?: string;
}

export type UpdateSubscriptionPayload = Partial<{
  start_date: string;
  end_date: string;
  product_limit: number;
  notes: string;
}>;

// Any authenticated tenant admin — resolves off the ambient X-Project-Code
// header apiClient already attaches.
export async function getMySubscriptionStatus(): Promise<ApiResponse<MySubscriptionStatus>> {
  return apiClient.get<ApiResponse<MySubscriptionStatus>>('/api/subscriptions/status');
}

// Superadmin only.
export async function getAllTenantSubscriptions(): Promise<
  ApiResponse<TenantSubscriptionSummary[]>
> {
  return apiClient.get<ApiResponse<TenantSubscriptionSummary[]>>('/api/subscriptions/admin');
}

// Superadmin only. Sorted newest first.
export async function getSubscriptionHistory(
  projectCode: string
): Promise<ApiResponse<SubscriptionRecord[]>> {
  return apiClient.get<ApiResponse<SubscriptionRecord[]>>(
    `/api/subscriptions/admin/${projectCode}/history`
  );
}

// Superadmin only. Creates a new subscription period — this is how "renew" works.
export async function createOrRenewSubscription(
  projectCode: string,
  payload: CreateOrRenewSubscriptionPayload
): Promise<ApiResponse<SubscriptionRecord>> {
  return apiClient.post<ApiResponse<SubscriptionRecord>>(
    `/api/subscriptions/admin/${projectCode}`,
    payload
  );
}

// Superadmin only. Only valid on an active/upcoming period — backend 400s otherwise.
export async function updateSubscription(
  projectCode: string,
  subId: string,
  payload: UpdateSubscriptionPayload
): Promise<ApiResponse<SubscriptionRecord>> {
  return apiClient.put<ApiResponse<SubscriptionRecord>>(
    `/api/subscriptions/admin/${projectCode}/${subId}`,
    payload
  );
}

// Superadmin only.
export async function cancelSubscription(
  projectCode: string,
  subId: string
): Promise<ApiResponse<SubscriptionRecord>> {
  return apiClient.post<ApiResponse<SubscriptionRecord>>(
    `/api/subscriptions/admin/${projectCode}/${subId}/cancel`
  );
}
